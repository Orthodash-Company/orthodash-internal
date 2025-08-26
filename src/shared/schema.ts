import { pgTable, text, serial, integer, real, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: Users are handled by Supabase Auth, so we don't need a users table
// We'll reference auth.users from Supabase directly

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  greyfinchId: text("greyfinch_id").unique(),
  address: text("address"),
  patientCount: integer("patient_count"),
  lastSyncDate: timestamp("last_sync_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced acquisition costs table for manual entries
export const acquisitionCosts = pgTable("acquisition_costs", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  userId: uuid("user_id").notNull(), // References Supabase auth.users.id
  referralType: text("referral_type").notNull(), // 'digital', 'professional', 'direct', 'manual'
  cost: real("cost").notNull(),
  period: text("period").notNull(), // 'YYYY-MM' format
  description: text("description"),
  source: text("source").default('manual'), // 'manual', 'meta', 'google', 'quickbooks'
  metadata: jsonb("metadata"), // Additional data from APIs
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API configurations for external integrations
export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References Supabase auth.users.id
  name: text("name").notNull(),
  type: text("type").notNull(), // 'meta', 'google', 'quickbooks'
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Platform-specific settings
  lastSyncDate: timestamp("last_sync_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API sync history for tracking data imports
export const apiSyncHistory = pgTable("api_sync_history", {
  id: serial("id").primaryKey(),
  apiConfigId: integer("api_config_id").references(() => apiConfigurations.id),
  userId: uuid("user_id").notNull(),
  syncType: text("sync_type").notNull(), // 'costs', 'revenue', 'vendors'
  period: text("period").notNull(), // 'YYYY-MM' format
  status: text("status").notNull(), // 'success', 'failed', 'partial'
  dataCount: integer("data_count").default(0),
  totalAmount: real("total_amount").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Raw API response data
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendor data from QuickBooks
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  apiConfigId: integer("api_config_id").references(() => apiConfigurations.id),
  vendorId: text("vendor_id").notNull(), // External vendor ID
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  category: text("category"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional vendor data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue data from QuickBooks
export const revenue = pgTable("revenue", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  apiConfigId: integer("api_config_id").references(() => apiConfigurations.id),
  locationId: integer("location_id").references(() => locations.id),
  period: text("period").notNull(), // 'YYYY-MM' format
  amount: real("amount").notNull(),
  category: text("category"),
  description: text("description"),
  transactionDate: timestamp("transaction_date"),
  metadata: jsonb("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow(),
});

// Ad spend data from Meta and Google
export const adSpend = pgTable("ad_spend", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  apiConfigId: integer("api_config_id").references(() => apiConfigurations.id),
  locationId: integer("location_id").references(() => locations.id),
  platform: text("platform").notNull(), // 'meta', 'google'
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  adSetId: text("ad_set_id"),
  adSetName: text("ad_set_name"),
  adId: text("ad_id"),
  adName: text("ad_name"),
  spend: real("spend").notNull(),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  conversions: integer("conversions"),
  period: text("period").notNull(), // 'YYYY-MM' format
  date: timestamp("date"),
  metadata: jsonb("metadata"), // Additional ad data
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyticsCache = pgTable("analytics_cache", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  dataType: text("data_type").notNull(), // 'analytics', 'acquisition_costs', etc.
  data: text("data").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References Supabase auth.users.id
  name: text("name").notNull(),
  description: text("description"),
  periodConfigs: text("period_configs").notNull(), // JSON string
  pdfUrl: text("pdf_url"),
  thumbnail: text("thumbnail"),
  isPublic: boolean("is_public").default(false),
  shareToken: text("share_token").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References Supabase auth.users.id
  name: text("name").notNull(),
  description: text("description"),
  greyfinchData: jsonb("greyfinch_data"), // Complete Greyfinch data
  acquisitionCosts: jsonb("acquisition_costs"), // All cost data
  periods: jsonb("periods"), // Period configurations
  aiSummary: jsonb("ai_summary"), // Generated AI summary
  metadata: jsonb("metadata"), // Additional session metadata
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema insert types
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAcquisitionCostSchema = createInsertSchema(acquisitionCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiSyncHistorySchema = createInsertSchema(apiSyncHistory).omit({
  id: true,
  createdAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueSchema = createInsertSchema(revenue).omit({
  id: true,
  createdAt: true,
});

export const insertAdSpendSchema = createInsertSchema(adSpend).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type AcquisitionCost = typeof acquisitionCosts.$inferSelect;
export type InsertAcquisitionCost = z.infer<typeof insertAcquisitionCostSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type ApiSyncHistory = typeof apiSyncHistory.$inferSelect;
export type InsertApiSyncHistory = z.infer<typeof insertApiSyncHistorySchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Revenue = typeof revenue.$inferSelect;
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;
export type AdSpend = typeof adSpend.$inferSelect;
export type InsertAdSpend = z.infer<typeof insertAdSpendSchema>;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

import { pgTable, text, serial, integer, real, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
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

export const acquisitionCosts = pgTable("acquisition_costs", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  referralType: text("referral_type").notNull(), // 'digital', 'professional', 'direct'
  cost: real("cost").notNull(),
  period: text("period").notNull(), // 'YYYY-MM' format
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type AcquisitionCost = typeof acquisitionCosts.$inferSelect;
export type InsertAcquisitionCost = z.infer<typeof insertAcquisitionCostSchema>;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

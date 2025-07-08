import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  greyfinchId: text("greyfinch_id").unique(),
  isActive: boolean("is_active").default(true),
});

export const acquisitionCosts = pgTable("acquisition_costs", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  referralType: text("referral_type").notNull(), // 'digital', 'professional', 'direct'
  cost: real("cost").notNull(),
  period: text("period").notNull(), // 'YYYY-MM' format
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyticsCache = pgTable("analytics_cache", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  dataType: text("data_type").notNull(), // 'referral_sources', 'conversion_rates', etc.
  data: text("data").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export const insertAcquisitionCostSchema = createInsertSchema(acquisitionCosts).omit({
  id: true,
  updatedAt: true,
});

export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type AcquisitionCost = typeof acquisitionCosts.$inferSelect;
export type InsertAcquisitionCost = z.infer<typeof insertAcquisitionCostSchema>;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;

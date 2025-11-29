import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const businessTypes = [
  "restaurant",
  "cafe",
  "retail",
  "gym",
  "salon",
  "pharmacy",
  "hotel",
  "bar",
  "bakery",
  "supermarket",
  "clinic",
  "dentist",
  "bank",
  "gas_station",
  "car_repair",
  "other"
] as const;

export type BusinessType = typeof businessTypes[number];

export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().$type<BusinessType>(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(businessTypes, { required_error: "Business type is required" }),
  name: z.string().min(1, "Business name is required").max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export interface Competitor {
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  distance?: string;
}

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  businessName: text("business_name").notNull(),
  competitors: jsonb("competitors").notNull().$type<Competitor[]>(),
  aiAnalysis: text("ai_analysis").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  html: text("html").notNull(),
});

export const competitorSchema = z.object({
  name: z.string(),
  address: z.string(),
  rating: z.number().optional(),
  userRatingsTotal: z.number().optional(),
  types: z.array(z.string()).optional(),
  distance: z.string().optional(),
});

export const insertReportSchema = z.object({
  businessId: z.string(),
  businessName: z.string(),
  competitors: z.array(competitorSchema),
  aiAnalysis: z.string(),
  html: z.string(),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

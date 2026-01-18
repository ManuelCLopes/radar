import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, jsonb, index, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

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

export const locationStatusValues = ["validated", "pending"] as const;
export type LocationStatus = typeof locationStatusValues[number];

export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Link business to user
  name: text("name").notNull(),
  type: text("type").notNull().$type<BusinessType>(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  locationStatus: text("location_status").default("validated").$type<LocationStatus>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(businessTypes, { required_error: "Business type is required" }),
  name: z.string().min(1, "Business name is required").max(100),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  address: z.string().min(1, "Address is required"),
  locationStatus: z.enum(locationStatusValues).default("validated"),
  userId: z.string().optional(), // Optional in schema, enforced in backend
});

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
}

export const placeResultSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().optional(),
  userRatingsTotal: z.number().optional(),
  types: z.array(z.string()).optional(),
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export interface Review {
  text: string;
  originalText?: string;
  author: string;
  rating: number;
  date: string; // ISO string
}

export interface Competitor {
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  distance?: string;
  priceLevel?: string;
  reviews?: Review[];
  latitude?: number;
  longitude?: number;
}

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  businessId: varchar("business_id"), // Made nullable to support address-only analysis if needed, or we create a temp business
  businessName: text("business_name").notNull(),
  competitors: jsonb("competitors").notNull().$type<Competitor[]>(),
  aiAnalysis: text("ai_analysis").notNull(),
  executiveSummary: text("executive_summary"), // Key summary like "Market Overview"
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  html: text("html"), // Made nullable for structured reports
  swotAnalysis: jsonb("swot_analysis"),
  marketTrends: jsonb("market_trends"),
  targetAudience: jsonb("target_audience"),
  marketingStrategy: jsonb("marketing_strategy"),
  customerSentiment: jsonb("customer_sentiment"),
  radius: integer("radius"), // Added radius field
});

export const reviewSchema = z.object({
  text: z.string(),
  originalText: z.string().optional(),
  author: z.string(),
  rating: z.number(),
  date: z.string(),
});

export const competitorSchema = z.object({
  name: z.string(),
  address: z.string(),
  rating: z.number().optional(),
  userRatingsTotal: z.number().optional(),
  types: z.array(z.string()).optional(),
  distance: z.string().optional(),
  priceLevel: z.string().optional(),
  reviews: z.array(reviewSchema).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const insertReportSchema = z.object({
  userId: z.string().optional().nullable(),
  businessId: z.string().optional().nullable(),
  businessName: z.string(),
  competitors: z.array(competitorSchema),
  aiAnalysis: z.string(),
  executiveSummary: z.string().optional(),
  html: z.string().optional(),
  swotAnalysis: z.record(z.any()).optional(),
  marketTrends: z.array(z.string()).optional(),
  targetAudience: z.record(z.any()).optional(),
  marketingStrategy: z.record(z.any()).optional(),
  customerSentiment: z.record(z.any()).optional(),
  radius: z.number().optional(),
  generatedAt: z.union([z.string(), z.date()]).optional(), // Allow backdating for seed
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  provider: text("provider"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  plan: text("plan").notNull().default("free"), // All users are free now - donations only!
  role: text("role").notNull().default("user"), // 'admin' or 'user'
  language: text("language").notNull().default("pt"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Searches table for tracking quick searches and saved searches
export const searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  address: varchar("address").notNull(),
  type: varchar("type").notNull(),
  radius: integer("radius").notNull(), // in meters
  latitude: real("latitude"),
  longitude: real("longitude"),
  competitorsFound: integer("competitors_found"),
  isPreview: boolean("is_preview").default(true),
  ipAddress: varchar("ip_address"), // For anonymous tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertSearch = typeof searches.$inferInsert;
export type Search = typeof searches.$inferSelect;


export const rateLimits = pgTable("rate_limits", {
  ip: varchar("ip").primaryKey(),
  hits: integer("hits").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});

export const apiUsage = pgTable("api_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: varchar("service").notNull(), // 'google_places', 'openai'
  endpoint: varchar("endpoint").notNull(), // 'textSearch', 'nearbySearch', 'analyze'
  tokens: integer("tokens"), // For AI
  costUnits: integer("cost_units").default(1), // Normalized cost metric
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertApiUsage = typeof apiUsage.$inferInsert;
export type ApiUsage = typeof apiUsage.$inferSelect;




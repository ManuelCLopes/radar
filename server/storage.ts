import { type Business, type InsertBusiness, type Report, type InsertReport, type User, type UpsertUser, businesses, reports, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getBusiness(id: string): Promise<Business | undefined>;
  listBusinesses(): Promise<Business[]>;
  addBusiness(business: InsertBusiness): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;
  
  saveReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByBusinessId(businessId: string): Promise<Report[]>;
  listAllReports(): Promise<Report[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || undefined;
  }

  async listBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async addBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await db
      .insert(businesses)
      .values(insertBusiness)
      .returning();
    return business;
  }

  async deleteBusiness(id: string): Promise<boolean> {
    const result = await db.delete(businesses).where(eq(businesses.id, id)).returning();
    return result.length > 0;
  }

  async saveReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsByBusinessId(businessId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.businessId, businessId))
      .orderBy(desc(reports.generatedAt));
  }

  async listAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.generatedAt));
  }
}

export const storage = new DatabaseStorage();

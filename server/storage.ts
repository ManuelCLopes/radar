import { type Business, type InsertBusiness, type Report, type InsertReport, type User, type UpsertUser, type InsertSearch, businesses, reports, users, searches } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getBusiness(id: string): Promise<Business | undefined>;
  listBusinesses(): Promise<Business[]>;
  addBusiness(business: InsertBusiness): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;

  saveReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByBusinessId(businessId: string): Promise<Report[]>;
  listAllReports(): Promise<Report[]>;

  // Search tracking
  trackSearch?(search: InsertSearch): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db!
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
    const [business] = await db!.select().from(businesses).where(eq(businesses.id, id));
    return business || undefined;
  }

  async listBusinesses(): Promise<Business[]> {
    return await db!.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async addBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await db!
      .insert(businesses)
      .values(insertBusiness)
      .returning();
    return business;
  }

  async deleteBusiness(id: string): Promise<boolean> {
    const result = await db!.delete(businesses).where(eq(businesses.id, id)).returning();
    return result.length > 0;
  }

  async saveReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db!
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db!.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsByBusinessId(businessId: string): Promise<Report[]> {
    return await db!
      .select()
      .from(reports)
      .where(eq(reports.businessId, businessId))
      .orderBy(desc(reports.generatedAt));
  }

  async listAllReports(): Promise<Report[]> {
    return await db!.select().from(reports).orderBy(desc(reports.generatedAt));
  }

  async trackSearch(search: InsertSearch): Promise<void> {
    await db!.insert(searches).values(search);
  }
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private businesses = new Map<string, Business>();
  private reportsMap = new Map<string, Report>();
  private searchesMap = new Map<string, InsertSearch>();

  constructor() {
    // Properties are initialized directly, no need for constructor assignments
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || `user-${Date.now()}`;
    const user: User = {
      id,
      email: userData.email!,
      passwordHash: userData.passwordHash ?? null,
      provider: userData.provider ?? "local",
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async listBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const id = `biz-${Date.now()}`;
    const business: Business = {
      ...insertBusiness,
      id,
      createdAt: new Date(),
      latitude: insertBusiness.latitude ?? null,
      longitude: insertBusiness.longitude ?? null,
      address: insertBusiness.address ?? null,
      locationStatus: insertBusiness.locationStatus ?? "validated",
    };
    this.businesses.set(id, business);
    return business;
  }

  async deleteBusiness(id: string): Promise<boolean> {
    return this.businesses.delete(id);
  }

  async saveReport(insertReport: InsertReport): Promise<Report> {
    const id = `rep-${Date.now()}`;
    const report: Report = {
      ...insertReport,
      id,
      generatedAt: new Date(),
    };
    this.reportsMap.set(id, report);
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reportsMap.get(id);
  }

  async getReportsByBusinessId(businessId: string): Promise<Report[]> {
    return Array.from(this.reportsMap.values())
      .filter((r) => r.businessId === businessId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async listAllReports(): Promise<Report[]> {
    return Array.from(this.reportsMap.values()).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async trackSearch(search: InsertSearch): Promise<void> {
    const id = 'search-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    this.searchesMap.set(id, { ...search, id });
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

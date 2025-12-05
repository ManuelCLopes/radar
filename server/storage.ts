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
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;

  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: string): Promise<Report[]>;
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

  async updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business> {
    const [updatedBusiness] = await db!
      .update(businesses)
      .set({ ...business, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();

    if (!updatedBusiness) {
      throw new Error("Business not found");
    }

    return updatedBusiness;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    return this.saveReport(insertReport);
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

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return await db!
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
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
  private users: Map<string, User>;
  private businesses: Map<string, Business>;
  private reports: Map<string, Report>;
  private searches: Map<string, InsertSearch>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.businesses = new Map();
    this.reports = new Map();
    this.searches = new Map();
    this.currentId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const id = user.id || String(this.currentId++);
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      passwordHash: user.passwordHash || null,
      plan: user.plan || "essential",
      provider: user.provider || "local"
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async listBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async addBusiness(business: InsertBusiness): Promise<Business> {
    const id = String(this.currentId++);
    const newBusiness: Business = {
      ...business,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      latitude: business.latitude ?? null,
      longitude: business.longitude ?? null,
      locationStatus: business.locationStatus ?? "validated"
    };
    this.businesses.set(id, newBusiness);
    return newBusiness;
  }

  async updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business> {
    const existingBusiness = this.businesses.get(id);
    if (!existingBusiness) {
      throw new Error("Business not found");
    }

    const updatedBusiness: Business = {
      ...existingBusiness,
      ...business,
      updatedAt: new Date()
    };

    this.businesses.set(id, updatedBusiness);
    return updatedBusiness;
  }

  async deleteBusiness(id: string): Promise<boolean> {
    return this.businesses.delete(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    return this.saveReport(insertReport);
  }

  async saveReport(insertReport: InsertReport): Promise<Report> {
    const id = String(this.currentId++);
    const report: Report = {
      ...insertReport,
      id,
      generatedAt: new Date(),
      userId: insertReport.userId || null,
      businessId: insertReport.businessId || null
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByBusinessId(businessId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter((report) => report.businessId === businessId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter((report) => report.userId === userId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async listAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async trackSearch(search: InsertSearch): Promise<void> {
    const id = String(this.currentId++);
    this.searches.set(id, search);
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

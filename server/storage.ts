import { type Business, type InsertBusiness, type Report, type InsertReport, type User, type UpsertUser, type InsertSearch, type PasswordResetToken, businesses, reports, users, searches, passwordResetTokens } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | undefined>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;

  getBusiness(id: string): Promise<Business | undefined>;
  listBusinesses(userId?: string): Promise<Business[]>;
  addBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;

  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: string): Promise<Report[]>;
  saveReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByBusinessId(businessId: string): Promise<Report[]>;
  listAllReports(): Promise<Report[]>;

  // Password reset
  createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  getPasswordResetToken(token: string): Promise<any>;
  markTokenAsUsed(token: string): Promise<void>;

  // Search tracking
  trackSearch?(search: InsertSearch): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const normalizedData = {
      ...userData,
      email: userData.email.toLowerCase(),
    };
    const [user] = await db!
      .insert(users)
      .values(normalizedData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...normalizedData,
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

  async listBusinesses(userId?: string): Promise<Business[]> {
    if (userId) {
      return await db!.select().from(businesses).where(eq(businesses.userId, userId)).orderBy(desc(businesses.createdAt));
    }
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

  // Password reset methods
  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.getUserByEmail(email);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db!.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }

  async createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<void> {
    await db!.insert(passwordResetTokens).values(data);
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db!.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db!.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));
  }

  async deleteUser(id: string): Promise<void> {
    // Reports and Searches should ideally have ON DELETE CASCADE, but let's be safe
    await db!.delete(reports).where(eq(reports.userId, id));
    await db!.delete(searches).where(eq(searches.userId, id));
    await db!.delete(users).where(eq(users.id, id));
  }
}

export class MemStorage implements IStorage {
  private currentId = 1;
  private users = new Map<string, User>();
  private businesses = new Map<string, Business>();
  private reports = new Map<string, Report>();
  private searches = new Map<string, any>();
  private resetTokens = new Map<string, any>();

  constructor() {
    this.searches = new Map();
    this.currentId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const lowerEmail = email.toLowerCase();
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === lowerEmail
    );
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const id = user.id || String(this.currentId++);
    const normalizedEmail = user.email.toLowerCase();
    const newUser: User = {
      ...user,
      id,
      email: normalizedEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      passwordHash: user.passwordHash || null,
      plan: user.plan || "free",
      language: user.language || "pt",
      provider: user.provider || "local"
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async listBusinesses(userId?: string): Promise<Business[]> {
    const all = Array.from(this.businesses.values());
    let businessesToReturn = all;
    if (userId) {
      businessesToReturn = all.filter(b => b.userId === userId);
    }
    return businessesToReturn.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      locationStatus: business.locationStatus ?? "validated",
      userId: business.userId || null // Add userId to MemStorage
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
      businessId: insertReport.businessId || null,
      html: insertReport.html || null,
      radius: insertReport.radius ?? null,
      executiveSummary: insertReport.executiveSummary || null,
      swotAnalysis: insertReport.swotAnalysis || null,
      marketTrends: insertReport.marketTrends || null,
      targetAudience: insertReport.targetAudience || null,
      marketingStrategy: insertReport.marketingStrategy || null,
      customerSentiment: insertReport.customerSentiment || null,
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
    this.searches.set(id, {
      id,
      ...search,
      createdAt: new Date(),
    });
  }

  // Password reset methods (in-memory)
  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.getUserByEmail(email);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId); // Changed from find to get
    if (user) {
      user.passwordHash = passwordHash;
      this.users.set(userId, user); // Ensure map is updated
    }
  }

  async createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<void> {
    this.resetTokens.set(data.token, {
      ...data,
      used: false,
      createdAt: new Date(),
    });
  }

  async getPasswordResetToken(token: string): Promise<any> {
    return this.resetTokens.get(token);
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const tokenData = this.resetTokens.get(token);
    if (tokenData) {
      tokenData.used = true;
      this.resetTokens.set(token, tokenData); // Ensure map is updated
    }
  }

  async deleteUser(id: string): Promise<void> {
    // Delete reports
    Array.from(this.reports.entries()).forEach(([reportId, report]) => {
      if (report.userId === id) {
        this.reports.delete(reportId);
      }
    });
    // Delete searches
    Array.from(this.searches.entries()).forEach(([searchId, search]) => {
      if (search.userId === id) {
        this.searches.delete(searchId);
      }
    });
    // Delete user
    this.users.delete(id);
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

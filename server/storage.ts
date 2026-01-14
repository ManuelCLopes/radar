import { type Business, type InsertBusiness, type Report, type InsertReport, type User, type UpsertUser, type InsertSearch, type Search, type PasswordResetToken, businesses, reports, users, searches, passwordResetTokens, rateLimits } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | undefined>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  listUsers(): Promise<User[]>; // Added for admin dashboard

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
  listRecentSearches?(): Promise<Search[]>;
  getSearchStats?(): Promise<{
    typeDistribution: { type: string; count: number }[];
    topLocations: { address: string; count: number }[];
    avgCompetitors: number;
    conversionRate: number;
  }>;
  deleteUser(id: string): Promise<void>;
  updateUserLanguage(userId: string, language: string): Promise<void>;
  checkRateLimit(ip: string): Promise<{ allowed: boolean, resetTime?: Date }>;
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

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db!
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return await db!.select().from(users).orderBy(desc(users.createdAt));
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

  async getSearchStats() {
    // Type Distribution
    const typedist = await db!.select({
      type: searches.type,
      count: sql<number>`count(*)`
    })
      .from(searches)
      .groupBy(searches.type);

    // Top Locations (simplified by address string for now)
    const toplocs = await db!.select({
      address: searches.address,
      count: sql<number>`count(*)`
    })
      .from(searches)
      .groupBy(searches.address)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Avg Competitors
    const [avgComp] = await db!.select({
      avg: sql<number>`avg(${searches.competitorsFound})`
    }).from(searches);

    // Conversion Rate
    const [totalSearches] = await db!.select({ count: sql<number>`count(*)` }).from(searches);
    const [totalReports] = await db!.select({ count: sql<number>`count(*)` }).from(reports);

    const searchCount = Number(totalSearches?.count || 0);
    const reportCount = Number(totalReports?.count || 0);

    return {
      typeDistribution: typedist.map(t => ({ type: t.type, count: Number(t.count) })),
      topLocations: toplocs.map(l => ({ address: l.address, count: Number(l.count) })),
      avgCompetitors: Math.round(Number(avgComp?.avg || 0)),
      conversionRate: searchCount > 0 ? (reportCount / searchCount) * 100 : 0
    };
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
    const reportToSave = {
      ...insertReport,
      generatedAt: insertReport.generatedAt ? new Date(insertReport.generatedAt) : new Date()
    };
    const [report] = await db!
      .insert(reports)
      .values(reportToSave)
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

  async listRecentSearches(): Promise<Search[]> {
    return await db!.select().from(searches).orderBy(desc(searches.createdAt)).limit(50);
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

  async updateUserLanguage(userId: string, language: string): Promise<void> {
    await db!
      .update(users)
      .set({ language, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async checkRateLimit(ip: string): Promise<{ allowed: boolean, resetTime?: Date }> {
    const now = new Date();
    const [rateLimit] = await db!.select().from(rateLimits).where(eq(rateLimits.ip, ip));

    if (rateLimit) {
      if (now > rateLimit.resetAt) {
        // Reset window
        await db!.update(rateLimits)
          .set({ hits: 1, resetAt: new Date(now.getTime() + 60 * 60 * 1000) })
          .where(eq(rateLimits.ip, ip));
        return { allowed: true };
      } else {
        // Within window
        if (rateLimit.hits >= 5) {
          return { allowed: false, resetTime: rateLimit.resetAt };
        }
        await db!.update(rateLimits)
          .set({ hits: rateLimit.hits + 1 })
          .where(eq(rateLimits.ip, ip));
        return { allowed: true };
      }
    } else {
      // New record
      await db!.insert(rateLimits).values({
        ip,
        hits: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000)
      });
      return { allowed: true };
    }
  }
}

export class MemStorage implements IStorage {
  private currentId = 1;
  private users = new Map<string, User>();
  private businesses = new Map<string, Business>();
  private reports = new Map<string, Report>();
  private searches = new Map<string, any>();
  private resetTokens = new Map<string, any>();
  private rateLimits = new Map<string, { hits: number, resetAt: Date }>();

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
      role: user.role || "user",
      language: user.language || "pt",
      provider: user.provider || "local"
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...existingUser,
      ...user,
      updatedAt: new Date()
    };

    if (user.email) {
      updatedUser.email = user.email.toLowerCase();
    }

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) =>
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
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

  async listRecentSearches(): Promise<Search[]> {
    return Array.from(this.searches.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);
  }

  async getSearchStats() {
    const searchList = Array.from(this.searches.values());
    const reportCount = this.reports.size;

    // Type Distribution
    const typeMap = new Map<string, number>();
    searchList.forEach(s => {
      typeMap.set(s.type, (typeMap.get(s.type) || 0) + 1);
    });
    const typeDistribution = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

    // Top Locations
    const locMap = new Map<string, number>();
    searchList.forEach(s => {
      locMap.set(s.address, (locMap.get(s.address) || 0) + 1);
    });
    const topLocations = Array.from(locMap.entries())
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Avg Competitors
    const totalCompetitors = searchList.reduce((acc, s) => acc + (s.competitorsFound || 0), 0);
    const avgCompetitors = searchList.length > 0 ? Math.round(totalCompetitors / searchList.length) : 0;

    // Conversion Rate
    const conversionRate = searchList.length > 0 ? (reportCount / searchList.length) * 100 : 0;

    return {
      typeDistribution,
      topLocations,
      avgCompetitors,
      conversionRate
    };
  }

  // Password reset methods (in-memory)
  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.getUserByEmail(email);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      this.users.set(userId, user);
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
      this.resetTokens.set(token, tokenData);
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

  async updateUserLanguage(userId: string, language: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.language = language;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async checkRateLimit(ip: string): Promise<{ allowed: boolean, resetTime?: Date }> {
    const now = new Date();
    const rateLimit = this.rateLimits.get(ip);

    if (rateLimit) {
      if (now > rateLimit.resetAt) {
        // Reset window
        this.rateLimits.set(ip, { hits: 1, resetAt: new Date(now.getTime() + 60 * 60 * 1000) });
        return { allowed: true };
      } else {
        // Within window
        if (rateLimit.hits >= 5) {
          return { allowed: false, resetTime: rateLimit.resetAt };
        }
        this.rateLimits.set(ip, { ...rateLimit, hits: rateLimit.hits + 1 });
        return { allowed: true };
      }
    } else {
      // New record
      this.rateLimits.set(ip, { hits: 1, resetAt: new Date(now.getTime() + 60 * 60 * 1000) });
      return { allowed: true };
    }
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

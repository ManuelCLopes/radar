import { type Business, type InsertBusiness, type Report, type InsertReport, type User, type UpsertUser, type InsertSearch, type Search, type PasswordResetToken, type InsertApiUsage, type ApiUsage, businesses, reports, users, searches, passwordResetTokens, rateLimits, apiUsage } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, isNotNull, lt, and, gte, inArray, not, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | undefined>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  listUsers(): Promise<User[]>; // Added for admin dashboard
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;

  getBusiness(id: string): Promise<Business | undefined>;
  listBusinesses(userId?: string): Promise<Business[]>;
  addBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: string): Promise<boolean>;

  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: string): Promise<Report[]>;
  saveReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByBusinessId(businessId: string): Promise<Report[]>;
  listAllReports(): Promise<Report[]>;
  countReportsCurrentMonth(userId: string): Promise<number>;
  deleteReport(id: string): Promise<boolean>;
  getReportByShareToken(token: string): Promise<Report | undefined>;

  // Password reset
  createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  getPasswordResetToken(token: string): Promise<any>;
  markTokenAsUsed(token: string): Promise<void>;

  // Search tracking
  trackSearch?(search: InsertSearch): Promise<void>;
  listRecentSearches?(): Promise<Search[]>;
  listSearchesByUserId(userId: string): Promise<Search[]>;
  getSearchStats?(): Promise<{
    typeDistribution: { type: string; count: number }[];
    topLocations: { address: string; count: number }[];
    avgCompetitors: number;
    conversionRate: number;
  }>;
  deleteUser(id: string): Promise<void>;
  updateUserLanguage(userId: string, language: string): Promise<void>;


  // API Usage
  trackApiUsage(usage: InsertApiUsage): Promise<void>;
  getApiUsageStats(days?: number): Promise<any>;
  getApiUsageByUser(limit?: number): Promise<any>;
  listApiUsageByUserId(userId: string): Promise<ApiUsage[]>;

  // Email Verification
  verifyUser(userId: string): Promise<void>;
  findUserByVerificationToken(token: string): Promise<User | undefined>;
  deleteExpiredUnverifiedUsers(): Promise<number>;
  deleteOldUnverifiedUsers(days: number): Promise<number>;
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

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || undefined;
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

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report> {
    const reportToUpdate = { ...report };
    if (reportToUpdate.generatedAt) {
      reportToUpdate.generatedAt = new Date(reportToUpdate.generatedAt);
    }

    const [updatedReport] = await db!
      .update(reports)
      .set(reportToUpdate as any)
      .where(eq(reports.id, id))
      .returning();

    if (!updatedReport) {
      throw new Error("Report not found");
    }

    return updatedReport;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db!.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsByBusinessId(businessId: string): Promise<Report[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return await db!
      .select()
      .from(reports)
      .where(and(
        eq(reports.businessId, businessId),
        not(like(reports.aiAnalysis, "Error:%")),
        or(
          not(eq(reports.aiAnalysis, "Generating...")),
          gte(reports.generatedAt, fiveMinutesAgo)
        )
      ))
      .orderBy(desc(reports.generatedAt));
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return await db!
      .select()
      .from(reports)
      .where(and(
        eq(reports.userId, userId),
        not(like(reports.aiAnalysis, "Error:%")),
        or(
          not(eq(reports.aiAnalysis, "Generating...")),
          gte(reports.generatedAt, fiveMinutesAgo)
        )
      ))
      .orderBy(desc(reports.generatedAt));
  }

  async listAllReports(): Promise<Report[]> {
    return await db!.select().from(reports).orderBy(desc(reports.generatedAt));
  }

  async countReportsCurrentMonth(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [result] = await db!
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(
        and(
          eq(reports.userId, userId),
          gte(reports.generatedAt, startOfMonth)
        )
      );
    return Number(result?.count || 0);
  }

  async deleteReport(id: string): Promise<boolean> {
    const [deleted] = await db!.delete(reports).where(eq(reports.id, id)).returning();
    return !!deleted;
  }

  async getReportByShareToken(token: string): Promise<Report | undefined> {
    const [report] = await db!.select().from(reports).where(eq(reports.shareToken, token));
    return report || undefined;
  }

  async trackSearch(search: InsertSearch): Promise<void> {
    await db!.insert(searches).values(search);
  }

  async listRecentSearches(): Promise<Search[]> {
    return await db!.select().from(searches).orderBy(desc(searches.createdAt)).limit(50);
  }

  async listSearchesByUserId(userId: string): Promise<Search[]> {
    return await db!
      .select()
      .from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.createdAt));
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
    await db!.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    await db!.delete(apiUsage).where(eq(apiUsage.userId, id));
    await db!.delete(businesses).where(eq(businesses.userId, id));
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



  async trackApiUsage(usage: InsertApiUsage): Promise<void> {
    const usageToSave = {
      ...usage,
      createdAt: new Date()
    };
    await db!.insert(apiUsage).values(usageToSave);
  }

  async getApiUsageStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usage = await db!.select()
      .from(apiUsage)
      .where(sql`${apiUsage.createdAt} >= ${startDate}`)
      .orderBy(desc(apiUsage.createdAt));

    // Group by date and service
    const stats = new Map<string, { date: string, google: number, openAi: number }>();

    // Initialize last 30 days
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      stats.set(dateStr, { date: dateStr, google: 0, openAi: 0 });
    }

    usage.forEach(record => {
      const dateStr = record.createdAt.toISOString().split('T')[0];
      const entry = stats.get(dateStr) || { date: dateStr, google: 0, openAi: 0 };

      if (record.service === 'google_places') {
        entry.google += (record.costUnits || 1);
      } else if (record.service === 'openai') {
        entry.openAi += (record.tokens || 0); // Or cost units
      }

      stats.set(dateStr, entry);
    });

    return Array.from(stats.values()).reverse();
  }

  async getApiUsageByUser(limit: number = 10): Promise<any> {
    const userUsage = await db!.select({
      userId: apiUsage.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      totalRequests: sql<number>`count(*)`,
      totalCost: sql<number>`sum(${apiUsage.costUnits})`
    })
      .from(apiUsage)
      .leftJoin(users, eq(apiUsage.userId, users.id))
      .where(isNotNull(apiUsage.userId))
      .groupBy(apiUsage.userId, users.firstName, users.lastName, users.email)
      .orderBy(desc(sql`sum(${apiUsage.costUnits})`))
      .limit(limit);

    return userUsage;
  }

  async listApiUsageByUserId(userId: string): Promise<ApiUsage[]> {
    return await db!
      .select()
      .from(apiUsage)
      .where(eq(apiUsage.userId, userId))
      .orderBy(desc(apiUsage.createdAt));
  }

  async verifyUser(userId: string): Promise<void> {
    await db!.update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null
      })
      .where(eq(users.id, userId));
  }

  async findUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async deleteExpiredUnverifiedUsers(): Promise<number> {
    const result = await db!
      .delete(users)
      .where(
        and(
          eq(users.isVerified, false),
          lt(users.verificationTokenExpiresAt, new Date())
        )
      )
      .returning();
    return result.length;
  }

  async deleteOldUnverifiedUsers(days: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Find users to delete
    const usersToDelete = await db!
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.isVerified, false),
          lt(users.createdAt, cutoffDate)
        )
      );

    if (usersToDelete.length === 0) {
      return 0;
    }

    const userIds = usersToDelete.map(u => u.id);

    // Manual Cascade Delete
    // 1. Delete API Usage
    await db!.delete(apiUsage).where(inArray(apiUsage.userId, userIds));

    // 2. Delete Businesses
    await db!.delete(businesses).where(inArray(businesses.userId, userIds));

    // 3. Delete Reports
    await db!.delete(reports).where(inArray(reports.userId, userIds));

    // 4. Delete Searches (already has ON DELETE CASCADE but good for safety if schema not synced)
    // await db!.delete(searches).where(inArray(searches.userId, userIds));

    // 5. Finally delete Users
    const result = await db!
      .delete(users)
      .where(inArray(users.id, userIds))
      .returning();

    return result.length;
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
  private apiUsage = new Map<string, ApiUsage>();

  constructor() {
    this.searches = new Map();
    this.currentId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.stripeCustomerId === stripeCustomerId);
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
      createdAt: user.createdAt || new Date(),
      updatedAt: new Date(),
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      passwordHash: user.passwordHash || null,
      plan: user.plan || "free",
      role: user.role || "user",
      language: user.language || "pt",
      provider: user.provider || "local",
      isVerified: user.isVerified ?? false,
      verificationToken: user.verificationToken || null,
      verificationTokenExpiresAt: user.verificationTokenExpiresAt || null,
      stripeCustomerId: user.stripeCustomerId || null,
      stripeSubscriptionId: user.stripeSubscriptionId || null,
      subscriptionStatus: user.subscriptionStatus || null,
      subscriptionPeriodEnd: user.subscriptionPeriodEnd || null
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
      userId: business.userId || null,
      rating: business.rating ?? null,
      userRatingsTotal: business.userRatingsTotal ?? null,
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
      businessRating: insertReport.businessRating ?? null,
      businessUserRatingsTotal: insertReport.businessUserRatingsTotal ?? null,
      shareToken: insertReport.shareToken || null,
      isShared: insertReport.isShared ?? false,
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report> {
    const existingReport = this.reports.get(id);
    if (!existingReport) {
      throw new Error("Report not found");
    }

    const updatedFields = { ...report };
    if (updatedFields.generatedAt) {
      updatedFields.generatedAt = new Date(updatedFields.generatedAt);
    }

    const updatedReport: Report = {
      ...existingReport,
      ...updatedFields,
      // Ensure generatedAt is always a Date
      generatedAt: updatedFields.generatedAt ? new Date(updatedFields.generatedAt) : existingReport.generatedAt,
    };

    this.reports.set(id, updatedReport);
    return updatedReport;
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

  async countReportsCurrentMonth(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return Array.from(this.reports.values()).filter(r =>
      r.userId === userId && r.generatedAt >= startOfMonth
    ).length;
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.reports.delete(id);
  }

  async getReportByShareToken(token: string): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(r => r.shareToken === token);
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

  async listSearchesByUserId(userId: string): Promise<Search[]> {
    return Array.from(this.searches.values())
      .filter((search) => search.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    // Delete password reset tokens
    Array.from(this.resetTokens.entries()).forEach(([token, data]) => {
      if (data.userId === id) {
        this.resetTokens.delete(token);
      }
    });

    // Delete API usage
    Array.from(this.apiUsage.entries()).forEach(([usageId, usage]) => {
      if (usage.userId === id) {
        this.apiUsage.delete(usageId);
      }
    });

    // Delete businesses
    Array.from(this.businesses.entries()).forEach(([businessId, business]) => {
      if (business.userId === id) {
        this.businesses.delete(businessId);
      }
    });

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

  async trackApiUsage(usage: InsertApiUsage): Promise<void> {
    const id = String(this.currentId++);
    this.apiUsage.set(id, {
      id,
      service: usage.service,
      endpoint: usage.endpoint,
      tokens: usage.tokens || null,
      costUnits: usage.costUnits || 1,
      userId: usage.userId || null,
      createdAt: new Date()
    });
  }

  async getApiUsageStats(days: number = 30): Promise<any> {
    const stats = new Map<string, { date: string, google: number, openAi: number }>();

    // Initialize last 30 days
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      stats.set(dateStr, { date: dateStr, google: 0, openAi: 0 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    this.apiUsage.forEach(usage => {
      if (usage.createdAt >= startDate) {
        const dateStr = usage.createdAt.toISOString().split('T')[0];
        const entry = stats.get(dateStr);
        if (entry) {
          if (usage.service === 'google_places') {
            entry.google += (usage.costUnits || 1);
          } else if (usage.service === 'openai') {
            entry.openAi += (usage.tokens || 0);
          }
        }
      }
    });

    return Array.from(stats.values()).reverse();
  }

  async getApiUsageByUser(limit: number = 10): Promise<any> {
    // Aggregate in memory
    const userMap = new Map<string, { userId: string, totalRequests: number, totalCost: number }>();

    this.apiUsage.forEach(usage => {
      if (usage.userId) {
        const entry = userMap.get(usage.userId) || { userId: usage.userId, totalRequests: 0, totalCost: 0 };
        entry.totalRequests += 1;
        entry.totalCost += (usage.costUnits || 0);
        if (usage.service === 'openai') {
          // For tokens we might want a different metric, but for now we sum 'costUnits' if set, or just use tokens/1000
          // In our tracking logic we set costUnits for both services.
        }
        userMap.set(usage.userId, entry);
      }
    });

    const sorted = Array.from(userMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);

    // Hydrate with user details
    const results = await Promise.all(sorted.map(async (entry) => {
      const user = await this.getUser(entry.userId);
      return {
        ...entry,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email
      };
    }));

    return results;
  }

  async listApiUsageByUserId(userId: string): Promise<ApiUsage[]> {
    return Array.from(this.apiUsage.values())
      .filter((usage) => usage.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async verifyUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = {
        ...user,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null
      };
      this.users.set(userId, updatedUser);
    }
  }

  async findUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.verificationToken === token);
  }

  async deleteExpiredUnverifiedUsers(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [id, user] of Array.from(this.users.entries())) {
      if (!user.isVerified && user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < now) {
        this.users.delete(id);
        count++;
      }
    }
    return count;
  }

  async deleteOldUnverifiedUsers(days: number): Promise<number> {
    let count = 0;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    for (const [id, user] of Array.from(this.users.entries())) {
      if (!user.isVerified && user.createdAt && user.createdAt < cutoffDate) {
        this.users.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

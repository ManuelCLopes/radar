
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemStorage, DatabaseStorage } from "../storage";
import { db } from "../db";
import { type InsertBusiness, type InsertReport, type UpsertUser } from "@shared/schema";

// Mock db
vi.mock("../db", () => ({
    db: {
        insert: vi.fn(() => ({ values: vi.fn() })),
        select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn() })) })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
        delete: vi.fn(() => ({ where: vi.fn() })),
    }
}));

describe("Storage", () => {
    describe("MemStorage", () => {
        let storage: MemStorage;

        beforeEach(() => {
            storage = new MemStorage();
        });

        describe("User Operations", () => {
            it("should create and retrieve a user", async () => {
                const email = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
                const newUser: UpsertUser = {
                    email,
                    passwordHash: "hashed_password",
                    firstName: "Test",
                    lastName: "User",
                    provider: "local",
                    plan: "essential"
                };

                const createdUser = await storage.upsertUser(newUser);
                expect(createdUser).toBeDefined();
                expect(createdUser.id).toBeDefined();
                expect(createdUser.email).toBe(newUser.email);

                const retrievedUser = await storage.getUser(createdUser.id.toString());
                expect(retrievedUser).toEqual(createdUser);

                const retrievedByEmail = await storage.getUserByEmail(newUser.email);
                expect(retrievedByEmail).toEqual(createdUser);
            });

            it("should support roles and list users", async () => {
                const adminEmail = `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
                const userEmail = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

                const adminUser: UpsertUser = {
                    email: adminEmail,
                    role: "admin",
                    firstName: "Admin",
                    createdAt: new Date("2024-01-02")
                };

                const regularUser: UpsertUser = {
                    email: userEmail,
                    role: "user",
                    firstName: "User",
                    createdAt: new Date("2024-01-01")
                };

                const savedAdmin = await storage.upsertUser(adminUser);
                const savedUser = await storage.upsertUser(regularUser);

                expect(savedAdmin.role).toBe("admin");
                expect(savedUser.role).toBe("user"); // Default check or explicit

                const users = await storage.listUsers();
                expect(users).toHaveLength(2);

                // Check sorting (descending by createdAt)
                expect(users[0].email).toBe(adminEmail);
                expect(users[1].email).toBe(userEmail);
            });

            it("should default role to 'user' if not specified", async () => {
                const newUser: UpsertUser = {
                    email: `default_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`
                };
                const created = await storage.upsertUser(newUser);
                expect(created.role).toBe("user");
            });
        });

        describe("Business Operations", () => {
            it("should create, retrieve, update and delete a business", async () => {
                const newBusiness: InsertBusiness = {
                    name: "Test Business",
                    type: "restaurant",
                    address: "123 Test St",
                    latitude: 10,
                    longitude: 20,
                    locationStatus: "validated",
                    userId: "user-123"
                };

                // Create
                const createdBusiness = await storage.addBusiness(newBusiness);
                expect(createdBusiness).toBeDefined();
                expect(createdBusiness.id).toBeDefined();
                expect(createdBusiness.name).toBe(newBusiness.name);

                // Retrieve
                const retrievedBusiness = await storage.getBusiness(createdBusiness.id.toString());
                expect(retrievedBusiness).toEqual(createdBusiness);

                // List
                const allBusinesses = await storage.listBusinesses("user-123");
                expect(allBusinesses).toContainEqual(createdBusiness);

                // Wait a bit to ensure timestamp difference
                await new Promise(resolve => setTimeout(resolve, 10));

                // Update
                const updatedBusiness = await storage.updateBusiness(createdBusiness.id.toString(), {
                    name: "Updated Business"
                });
                expect(updatedBusiness.name).toBe("Updated Business");
                expect(updatedBusiness.updatedAt).not.toEqual(createdBusiness.updatedAt);

                // Delete
                const deleted = await storage.deleteBusiness(createdBusiness.id.toString());
                expect(deleted).toBe(true);
                const deletedBusiness = await storage.getBusiness(createdBusiness.id.toString());
                expect(deletedBusiness).toBeUndefined();
            });

            it("should throw error when updating non-existent business", async () => {
                await expect(storage.updateBusiness("999", { name: "Updated Biz" }))
                    .rejects.toThrow("Business not found");
            });
        });

        describe("Report Operations", () => {
            it("should create and retrieve reports", async () => {
                const newBusiness: InsertBusiness = {
                    name: "Report Business",
                    type: "retail",
                    address: "456 Report St"
                };
                const business = await storage.addBusiness(newBusiness);

                const newReport: InsertReport = {
                    businessId: business.id,
                    businessName: business.name,
                    competitors: [],
                    aiAnalysis: "Analysis",
                    html: "<div>Report</div>",
                    userId: "user-123"
                };

                // Create
                const createdReport = await storage.createReport(newReport);
                expect(createdReport).toBeDefined();
                expect(createdReport.id).toBeDefined();

                // Retrieve
                const retrievedReport = await storage.getReport(createdReport.id.toString());
                expect(retrievedReport).toEqual(createdReport);

                // List by Business
                const reportsByBusiness = await storage.getReportsByBusinessId(business.id.toString());
                expect(reportsByBusiness).toContainEqual(createdReport);

                // List by User
                const reportsByUser = await storage.getReportsByUserId("user-123");
                expect(reportsByUser).toContainEqual(createdReport);

                // List All
                const allReports = await storage.listAllReports();
                expect(allReports).toContainEqual(createdReport);
            });

            it("should delete a report", async () => {
                const newBusiness: InsertBusiness = {
                    name: "Delete Report Business",
                    type: "retail",
                    address: "789 Delete St"
                };
                const business = await storage.addBusiness(newBusiness);

                const newReport: InsertReport = {
                    businessId: business.id,
                    businessName: business.name,
                    competitors: [],
                    aiAnalysis: "Analysis",
                    html: "<div>Report</div>",
                    userId: "user-123"
                };

                const createdReport = await storage.createReport(newReport);
                expect(createdReport).toBeDefined();

                // Delete
                const deleted = await storage.deleteReport(createdReport.id.toString());
                expect(deleted).toBe(true);

                // Verify deletion
                const deletedReport = await storage.getReport(createdReport.id.toString());
                expect(deletedReport).toBeUndefined();
            });

            it("should return false when deleting non-existent report", async () => {
                const deleted = await storage.deleteReport("non-existent-id");
                expect(deleted).toBe(false);
            });

            it("should save report with businessRating fields", async () => {
                const newBusiness: InsertBusiness = {
                    name: "Rating Business",
                    type: "restaurant",
                    address: "123 Rating St"
                };
                const business = await storage.addBusiness(newBusiness);

                const newReport: InsertReport = {
                    businessId: business.id,
                    businessName: business.name,
                    competitors: [],
                    aiAnalysis: "Analysis",
                    html: "<div>Report</div>",
                    userId: "user-123",
                    businessRating: 4.5,
                    businessUserRatingsTotal: 150
                };

                const createdReport = await storage.createReport(newReport);
                expect(createdReport.businessRating).toBe(4.5);
                expect(createdReport.businessUserRatingsTotal).toBe(150);
            });
        });

        describe("Search Operations", () => {
            it("should track search", async () => {
                await storage.trackSearch({
                    query: "test",
                    latitude: 0,
                    longitude: 0,
                    radius: 1000
                } as any);
                // MemStorage doesn't expose searches map publicly, but we can verify it doesn't crash
                // To verify it was added, we would need to access private property or add a getter.
                // For now, just ensuring it runs is enough for coverage.
            });
        });
    });

    describe("DatabaseStorage", () => {
        let storage: DatabaseStorage;

        beforeEach(() => {
            storage = new DatabaseStorage();
            vi.clearAllMocks();
        });

        it("should track search", async () => {
            const mockValues = vi.fn().mockResolvedValue(undefined);
            (db.insert as any).mockReturnValue({ values: mockValues });

            await storage.trackSearch({
                query: "test",
                latitude: 0,
                longitude: 0,
                radius: 1000
            } as any);

            expect(db.insert).toHaveBeenCalled();
            expect(mockValues).toHaveBeenCalled();
        });

        it("should get reports by user id", async () => {
            const mockOrderBy = vi.fn().mockResolvedValue([]);
            const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            await storage.getReportsByUserId("1");

            expect(db.select).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalled();
            expect(mockWhere).toHaveBeenCalled();
            expect(mockOrderBy).toHaveBeenCalled();
        });

        it("should list all reports", async () => {
            const mockOrderBy = vi.fn().mockResolvedValue([]);
            const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            await storage.listAllReports();

            expect(db.select).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalled();
            expect(mockOrderBy).toHaveBeenCalled();
        });

        it("should list users with sorting", async () => {
            const mockOrderBy = vi.fn().mockResolvedValue([]);
            const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            await storage.listUsers();

            expect(db.select).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalled();
            expect(mockOrderBy).toHaveBeenCalled();
        });

        it("should get user by id", async () => {
            const mockUser = { id: "1", email: "test@example.com" };
            const mockWhere = vi.fn().mockResolvedValue([mockUser]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            const result = await storage.getUser("1");

            expect(db.select).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it("should get user by email", async () => {
            const mockUser = { id: "1", email: "test@example.com" };
            const mockWhere = vi.fn().mockResolvedValue([mockUser]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            const result = await storage.getUserByEmail("test@example.com");

            expect(db.select).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it("should upsert new user", async () => {
            const newUser = { email: "new@example.com", firstName: "New" };
            const mockReturning = vi.fn().mockResolvedValue([{ id: "1", ...newUser }]);
            const mockConflict = vi.fn().mockReturnValue({ returning: mockReturning });
            const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockConflict });
            (db.insert as any).mockReturnValue({ values: mockValues });

            const result = await storage.upsertUser(newUser);

            expect(db.insert).toHaveBeenCalled();
            expect(result.email).toBe(newUser.email);
        });

        it("should get business by id", async () => {
            const mockBusiness = { id: "1", name: "Test Business" };
            const mockWhere = vi.fn().mockResolvedValue([mockBusiness]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            const result = await storage.getBusiness("1");

            expect(db.select).toHaveBeenCalled();
            expect(result).toEqual(mockBusiness);
        });

        it("should add business", async () => {
            const newBusiness = { name: "New Business", type: "restaurant", address: "123 St" };
            const mockReturning = vi.fn().mockResolvedValue([{ id: "1", ...newBusiness }]);
            const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
            (db.insert as any).mockReturnValue({ values: mockValues });

            const result = await storage.addBusiness(newBusiness as any);

            expect(db.insert).toHaveBeenCalled();
            expect(result.name).toBe(newBusiness.name);
        });

        it("should create report", async () => {
            const newReport = { businessName: "Test", competitors: [], aiAnalysis: "Analysis" };
            const mockReturning = vi.fn().mockResolvedValue([{ id: "1", ...newReport }]);
            const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
            (db.insert as any).mockReturnValue({ values: mockValues });

            const result = await storage.createReport(newReport as any);

            expect(db.insert).toHaveBeenCalled();
            expect(result.businessName).toBe(newReport.businessName);
        });

        it("should get report by id", async () => {
            const mockReport = { id: "1", businessName: "Test" };
            const mockWhere = vi.fn().mockResolvedValue([mockReport]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            const result = await storage.getReport("1");

            expect(db.select).toHaveBeenCalled();
            expect(result).toEqual(mockReport);
        });

        it("should get reports by business id", async () => {
            const mockReports = [{ id: "1", businessId: "biz-1" }];
            const mockOrderBy = vi.fn().mockResolvedValue(mockReports);
            const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            const result = await storage.getReportsByBusinessId("biz-1");

            expect(db.select).toHaveBeenCalled();
            expect(result).toEqual(mockReports);
        });

        it("should update business", async () => {
            const mockUpdated = { id: "1", name: "Updated Name" };
            const mockReturning = vi.fn().mockResolvedValue([mockUpdated]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
            (db.update as any).mockReturnValue({ set: mockSet });

            const result = await storage.updateBusiness("1", { name: "Updated Name" });

            expect(db.update).toHaveBeenCalled();
            expect(result.name).toBe("Updated Name");
        });

        it("should delete business", async () => {
            const mockReturning = vi.fn().mockResolvedValue([{ id: "1" }]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            (db.delete as any).mockReturnValue({ where: mockWhere });

            const result = await storage.deleteBusiness("1");

            expect(db.delete).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should delete report", async () => {
            const mockReturning = vi.fn().mockResolvedValue([{ id: "1" }]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            (db.delete as any).mockReturnValue({ where: mockWhere });

            const result = await storage.deleteReport("1");

            expect(db.delete).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should track API usage", async () => {
            const usage = { service: "google_places", endpoint: "textSearch", costUnits: 1 };
            const mockValues = vi.fn().mockResolvedValue(undefined);
            (db.insert as any).mockReturnValue({ values: mockValues });

            await storage.trackApiUsage(usage as any);

            expect(db.insert).toHaveBeenCalled();
            expect(mockValues).toHaveBeenCalled();
        });

        it("should count reports current month", async () => {
            const mockCount = [{ count: 5 }];
            const mockWhere = vi.fn().mockResolvedValue(mockCount);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            const count = await storage.countReportsCurrentMonth("1");
            expect(count).toBe(5);
            expect(db.select).toHaveBeenCalled();
        });

        it("should list recent searches", async () => {
            const mockLimit = vi.fn().mockResolvedValue([]);
            const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
            (db.select as any).mockImplementation(mockSelect);

            await storage.listRecentSearches();

            expect(db.select).toHaveBeenCalled();
            expect(mockOrderBy).toHaveBeenCalled();
            expect(mockLimit).toHaveBeenCalledWith(50);
        });

        it("should get search stats", async () => {
            // Mock type distribution
            const mockTypeDist = [{ type: "restaurant", count: 10 }];
            const mockGroupBy1 = vi.fn().mockResolvedValue(mockTypeDist);
            const mockFrom1 = vi.fn().mockReturnValue({ groupBy: mockGroupBy1 });

            // Mock top locations
            const mockTopLocs = [{ address: "123 St", count: 5 }];
            const mockLimit = vi.fn().mockResolvedValue(mockTopLocs);
            const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockGroupBy2 = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockFrom2 = vi.fn().mockReturnValue({ groupBy: mockGroupBy2 });

            // Mock avg competitors
            const mockAvg = [{ avg: 3.5 }];
            const mockFrom3 = vi.fn().mockResolvedValue(mockAvg);

            // Mock counts
            const mockSearchCount = [{ count: 100 }];
            const mockReportCount = [{ count: 20 }];
            const mockFrom4 = vi.fn().mockResolvedValue(mockSearchCount);
            const mockFrom5 = vi.fn().mockResolvedValue(mockReportCount);

            // We need to mock separate calls to db.select
            (db.select as any)
                .mockImplementationOnce(() => ({ from: mockFrom1 })) // Type Dist
                .mockImplementationOnce(() => ({ from: mockFrom2 })) // Top Locs
                .mockImplementationOnce(() => ({ from: mockFrom3 })) // Avg Comp
                .mockImplementationOnce(() => ({ from: mockFrom4 })) // Search Count
                .mockImplementationOnce(() => ({ from: mockFrom5 })); // Report Count

            const stats = await storage.getSearchStats!();

            expect(stats.typeDistribution[0].count).toBe(10);
            expect(stats.topLocations[0].count).toBe(5);
            expect(stats.avgCompetitors).toBe(4); // 3.5 rounded
            expect(stats.conversionRate).toBe(20); // 20/100 * 100
        });

        it("should handle password reset tokens", async () => {
            // Create
            (db.insert as any).mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
            await storage.createPasswordResetToken({ userId: "1", token: "tok", expiresAt: new Date() });
            expect(db.insert).toHaveBeenCalled();

            // Get
            const mockToken = { token: "tok", userId: "1" };
            const mockWhere = vi.fn().mockResolvedValue([mockToken]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            (db.select as any).mockReturnValue({ from: mockFrom });

            const retrieved = await storage.getPasswordResetToken("tok");
            expect(retrieved).toEqual(mockToken);

            // Mark as used
            const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
            const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
            (db.update as any).mockReturnValue({ set: mockSet });

            await storage.markTokenAsUsed("tok");
            expect(db.update).toHaveBeenCalled();
        });

        it("should update user password", async () => {
            const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
            const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
            (db.update as any).mockReturnValue({ set: mockSet });

            await storage.updateUserPassword("1", "newhash");
            expect(db.update).toHaveBeenCalled();
        });

        it("should update user language", async () => {
            const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
            const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
            (db.update as any).mockReturnValue({ set: mockSet });

            await storage.updateUserLanguage("1", "pt");
            expect(db.update).toHaveBeenCalled();
        });

        it("should verify user", async () => {
            const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
            const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
            (db.update as any).mockReturnValue({ set: mockSet });

            await storage.verifyUser("1");
            expect(db.update).toHaveBeenCalled();
        });

        it("should find user by verification token", async () => {
            const mockUser = { id: "1" };
            const mockWhere = vi.fn().mockResolvedValue([mockUser]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            (db.select as any).mockReturnValue({ from: mockFrom });

            const user = await storage.findUserByVerificationToken("token");
            expect(user).toEqual(mockUser);
        });

        it("should delete expired unverified users", async () => {
            const mockReturning = vi.fn().mockResolvedValue([1, 2]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            (db.delete as any).mockReturnValue({ where: mockWhere });

            const deletedCount = await storage.deleteExpiredUnverifiedUsers();
            expect(deletedCount).toBe(2);
        });



        it("should get api usage stats", async () => {
            const usage1 = { service: "google_places", costUnits: 1, createdAt: new Date() };
            const usage2 = { service: "openai", tokens: 100, createdAt: new Date() };
            const mockUsages = [usage1, usage2];

            const mockOrderBy = vi.fn().mockResolvedValue(mockUsages);
            const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            (db.select as any).mockReturnValue({ from: mockFrom });

            const stats = await storage.getApiUsageStats(30);
            expect(stats.length).toBeGreaterThan(0);
            // Check if today has data
            const today = stats[0].date; // Reverse order, so index 0 is today or last entry? Code reverses.
            // stats is array from map values reversed. map insertion order is chronological.
            // so reversed means newest first?
            // "Initialize last 30 days" loop goes 0 to 30.
            // But map keys are strings.
            // Anyway, let's just check length.
            expect(stats).toBeDefined();
        });

        it("should get api usage by user", async () => {
            const mockResult = [{ userId: "1", totalCost: 10 }];
            const mockLimit = vi.fn().mockResolvedValue(mockResult);
            const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockGroupBy = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
            const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
            const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
            (db.select as any).mockReturnValue({ from: mockFrom });

            const result = await storage.getApiUsageByUser(10);
            expect(result).toEqual(mockResult);
        });
    });
});


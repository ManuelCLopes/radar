
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
                const newUser: UpsertUser = {
                    email: "test@example.com",
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
                const adminUser: UpsertUser = {
                    email: "admin@example.com",
                    role: "admin",
                    firstName: "Admin",
                    createdAt: new Date("2024-01-02")
                };

                const regularUser: UpsertUser = {
                    email: "user@example.com",
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
                expect(users[0].email).toBe("admin@example.com");
                expect(users[1].email).toBe("user@example.com");
            });

            it("should default role to 'user' if not specified", async () => {
                const newUser: UpsertUser = {
                    email: "default@example.com"
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
    });
});

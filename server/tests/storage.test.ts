
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
        });

        describe("Business Operations", () => {
            it("should create, retrieve, update and delete a business", async () => {
                const newBusiness: InsertBusiness = {
                    name: "Test Business",
                    type: "restaurant",
                    address: "123 Test St",
                    latitude: 10,
                    longitude: 20,
                    locationStatus: "validated"
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
                const allBusinesses = await storage.listBusinesses();
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
    });
});

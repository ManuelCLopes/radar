import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseStorage } from "../storage";
import { db } from "../db";
import type { InsertBusiness, InsertReport, UpsertUser } from "@shared/schema";

// Mock db with more comprehensive mocking
vi.mock("../db", () => ({
    db: {
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    }
}));

describe("DatabaseStorage Coverage", () => {
    let storage: DatabaseStorage;

    beforeEach(() => {
        storage = new DatabaseStorage();
        vi.clearAllMocks();
    });

    describe("User Operations", () => {
        it("should get user by id", async () => {
            const mockUser = { id: "1", email: "test@test.com" };
            const mockWhere = vi.fn().mockResolvedValue([mockUser]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const user = await storage.getUser("1");

            expect(user).toEqual(mockUser);
            expect(db.select).toHaveBeenCalled();
        });

        it("should return undefined for non-existent user", async () => {
            const mockWhere = vi.fn().mockResolvedValue([]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const user = await storage.getUser("999");

            expect(user).toBeUndefined();
        });

        it("should get user by email", async () => {
            const mockUser = { id: "1", email: "test@test.com" };
            const mockWhere = vi.fn().mockResolvedValue([mockUser]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const user = await storage.getUserByEmail("test@test.com");

            expect(user).toEqual(mockUser);
        });

        it("should upsert user", async () => {
            const userData: UpsertUser = {
                email: "new@test.com",
                passwordHash: "hash",
                provider: "local",
                plan: "essential"
            };
            const mockUser = { ...userData, id: "1", createdAt: new Date(), updatedAt: new Date() };
            const mockReturning = vi.fn().mockResolvedValue([mockUser]);
            const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
            const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
            vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

            const user = await storage.upsertUser(userData);

            expect(user).toEqual(mockUser);
            expect(db.insert).toHaveBeenCalled();
        });
    });

    describe("Business Operations", () => {
        it("should get business by id", async () => {
            const mockBusiness = { id: "1", name: "Test Biz" };
            const mockWhere = vi.fn().mockResolvedValue([mockBusiness]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const business = await storage.getBusiness("1");

            expect(business).toEqual(mockBusiness);
        });

        it("should return undefined for non-existent business", async () => {
            const mockWhere = vi.fn().mockResolvedValue([]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const business = await storage.getBusiness("999");

            expect(business).toBeUndefined();
        });

        it("should list businesses", async () => {
            const mockBusinesses = [{ id: "1", name: "Biz 1" }];
            const mockOrderBy = vi.fn().mockResolvedValue(mockBusinesses);
            const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const businesses = await storage.listBusinesses();

            expect(businesses).toEqual(mockBusinesses);
        });

        it("should add business", async () => {
            const newBusiness: InsertBusiness = {
                name: "New Biz",
                type: "restaurant",
                address: "123 St"
            };
            const mockBusiness = { ...newBusiness, id: "1", createdAt: new Date() };
            const mockReturning = vi.fn().mockResolvedValue([mockBusiness]);
            const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
            vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

            const business = await storage.addBusiness(newBusiness);

            expect(business).toEqual(mockBusiness);
        });

        it("should delete business", async () => {
            const mockReturning = vi.fn().mockResolvedValue([{ id: "1" }]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            vi.mocked(db.delete).mockReturnValue({ where: mockWhere } as any);

            const deleted = await storage.deleteBusiness("1");

            expect(deleted).toBe(true);
        });

        it("should return false when deleting non-existent business", async () => {
            const mockReturning = vi.fn().mockResolvedValue([]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            vi.mocked(db.delete).mockReturnValue({ where: mockWhere } as any);

            const deleted = await storage.deleteBusiness("999");

            expect(deleted).toBe(false);
        });

        it("should update business", async () => {
            const updates = { name: "Updated" };
            const mockBusiness = { id: "1", name: "Updated", updatedAt: new Date() };
            const mockReturning = vi.fn().mockResolvedValue([mockBusiness]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);

            const business = await storage.updateBusiness("1", updates);

            expect(business).toEqual(mockBusiness);
        });

        it("should throw error when updating non-existent business", async () => {
            const mockReturning = vi.fn().mockResolvedValue([]);
            const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
            const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);

            await expect(storage.updateBusiness("999", { name: "Updated" }))
                .rejects.toThrow("Business not found");
        });
    });

    describe("Report Operations", () => {
        it("should create report via createReport", async () => {
            const newReport: InsertReport = {
                businessName: "Biz",
                competitors: [],
                aiAnalysis: "Analysis",
                html: "<div></div>",
                userId: "user-1"
            };
            const mockReport = { ...newReport, id: "1", generatedAt: new Date() };
            const mockReturning = vi.fn().mockResolvedValue([mockReport]);
            const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
            vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

            const report = await storage.createReport(newReport);

            expect(report).toEqual(mockReport);
        });

        it("should save report", async () => {
            const newReport: InsertReport = {
                businessName: "Biz",
                competitors: [],
                aiAnalysis: "Analysis",
                html: "<div></div>",
                userId: "user-1"
            };
            const mockReport = { ...newReport, id: "1", generatedAt: new Date() };
            const mockReturning = vi.fn().mockResolvedValue([mockReport]);
            const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
            vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

            const report = await storage.saveReport(newReport);

            expect(report).toEqual(mockReport);
        });

        it("should get report by id", async () => {
            const mockReport = { id: "1", businessName: "Biz" };
            const mockWhere = vi.fn().mockResolvedValue([mockReport]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const report = await storage.getReport("1");

            expect(report).toEqual(mockReport);
        });

        it("should return undefined for non-existent report", async () => {
            const mockWhere = vi.fn().mockResolvedValue([]);
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const report = await storage.getReport("999");

            expect(report).toBeUndefined();
        });

        it("should get reports by business id", async () => {
            const mockReports = [{ id: "1", businessId: "biz-1" }];
            const mockOrderBy = vi.fn().mockResolvedValue(mockReports);
            const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

            const reports = await storage.getReportsByBusinessId("biz-1");

            expect(reports).toEqual(mockReports);
        });
    });
});

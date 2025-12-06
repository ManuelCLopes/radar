import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "../storage";
import { type InsertBusiness, type InsertReport, type UpsertUser } from "@shared/schema";

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
            expect(createdReport.businessId).toBe(business.id);

            // Retrieve by ID
            const retrievedReport = await storage.getReport(createdReport.id.toString());
            expect(retrievedReport).toEqual(createdReport);

            // Retrieve by Business ID
            const businessReports = await storage.getReportsByBusinessId(business.id.toString());
            expect(businessReports).toContainEqual(createdReport);

            // Retrieve by User ID
            const userReports = await storage.getReportsByUserId("user-123");
            expect(userReports).toContainEqual(createdReport);
        });
    });
});


import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerReportRoutes } from "../routes/reports";
import request from "supertest";

// Mock dependencies
const mockUser = {
    id: "user1",
    email: "user1@example.com",
    role: "user"
};

const { mockStorage } = vi.hoisted(() => ({
    mockStorage: {
        getReport: vi.fn(),
        getBusiness: vi.fn(),
        getReportsByBusinessId: vi.fn(),
        getReportsByUserId: vi.fn(),
        createReport: vi.fn(),
        deleteReport: vi.fn(),
    }
}));

vi.mock("../storage", () => ({
    storage: mockStorage
}));

vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
    }
}));

vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn()
}));

const app = express();
app.use(express.json());
registerReportRoutes(app);

describe("Report Security (IDOR)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should prevent accessing a report belonging to another user", async () => {
        mockStorage.getReport.mockResolvedValue({
            id: "report123",
            userId: "user2", // Different user
            businessId: "biz1",
            generatedAt: new Date()
        });

        const res = await request(app).get("/api/reports/report123");

        expect(res.status).toBe(403);
    });

    it("should allow accessing own report", async () => {
        mockStorage.getReport.mockResolvedValue({
            id: "report123",
            userId: "user1", // Same user
            businessId: "biz1",
            generatedAt: new Date()
        });

        const res = await request(app).get("/api/reports/report123");

        expect(res.status).toBe(200);
    });

    it("should prevent running a report for a business belonging to another user", async () => {
        mockStorage.getBusiness.mockResolvedValue({
            id: "biz123",
            userId: "user2", // Different user
            name: "Test Biz"
        });

        const res = await request(app).post("/api/run-report/biz123").send({
            email: "test@example.com",
            language: "en"
        });

        expect(res.status).toBe(403);
    });

    it("should prevent listing reports for a business belonging to another user", async () => {
        mockStorage.getBusiness.mockResolvedValue({
            id: "biz123",
            userId: "user2", // Different user
            name: "Test Biz"
        });

        // Note: The route actually calls getReportsByBusinessId, but we should add a check
        // First we need to mock what happens when we check ownership.
        // If the route doesn't check business ownership first, it might just return reports.
        // We want to ensure it CHECKS ownership.
        // Let's assume the route will fetch the business first to check ownership.

        const res = await request(app).get("/api/reports/business/biz123");

        expect(res.status).toBe(403);
    });

    it("should prevent deleting a report belonging to another user", async () => {
        mockStorage.getReport.mockResolvedValue({
            id: "report123",
            userId: "user2", // Different user
            businessId: "biz1",
            generatedAt: new Date()
        });

        const res = await request(app).delete("/api/reports/report123");

        expect(res.status).toBe(403);
        expect(mockStorage.deleteReport).not.toHaveBeenCalled();
    });

    it("should allow deleting own report", async () => {
        mockStorage.getReport.mockResolvedValue({
            id: "report123",
            userId: "user1", // Same user
            businessId: "biz1",
            generatedAt: new Date()
        });
        mockStorage.deleteReport.mockResolvedValue(true);

        const res = await request(app).delete("/api/reports/report123");

        expect(res.status).toBe(200);
        expect(mockStorage.deleteReport).toHaveBeenCalledWith("report123");
    });

    it("should return 404 when deleting non-existent report", async () => {
        mockStorage.getReport.mockResolvedValue(null);

        const res = await request(app).delete("/api/reports/non-existent");

        expect(res.status).toBe(404);
    });
});

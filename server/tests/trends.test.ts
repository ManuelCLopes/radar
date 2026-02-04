import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerTrendRoutes } from "../routes/trends";
import request from "supertest";

// Mock user (pro plan)
const mockProUser = {
    id: "user1",
    email: "pro@example.com",
    role: "user",
    plan: "pro"
};

const mockEssentialUser = {
    id: "user2",
    email: "essential@example.com",
    role: "user",
    plan: "essential"
};

const { mockStorage } = vi.hoisted(() => ({
    mockStorage: {
        getBusiness: vi.fn(),
        getReportsByBusinessId: vi.fn(),
    }
}));

vi.mock("../storage", () => ({
    storage: mockStorage
}));

let currentUser = mockProUser;

vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        req.user = currentUser;
        next();
    }
}));

const app = express();
app.use(express.json());
registerTrendRoutes(app);

describe("Trends API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentUser = mockProUser;
    });

    describe("GET /api/trends/:businessId", () => {
        it("should return trends data for pro user", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz1",
                userId: "user1",
                name: "Test Business",
                rating: 4.0
            });

            mockStorage.getReportsByBusinessId.mockResolvedValue([
                {
                    id: "report1",
                    generatedAt: new Date("2025-01-01"),
                    competitors: [
                        { name: "Comp 1", rating: 4.5 },
                        { name: "Comp 2", rating: 4.0 }
                    ],
                    businessRating: 4.2
                },
                {
                    id: "report2",
                    generatedAt: new Date("2025-01-15"),
                    competitors: [
                        { name: "Comp 1", rating: 4.6 },
                        { name: "Comp 2", rating: 4.1 }
                    ],
                    businessRating: 4.3
                }
            ]);

            const res = await request(app).get("/api/trends/biz1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].businessRating).toBe(4.2);
            expect(res.body[1].businessRating).toBe(4.3);
        });

        it("should prioritize report.businessRating over competitor match", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz1",
                userId: "user1",
                name: "Test Business",
                rating: 3.5
            });

            mockStorage.getReportsByBusinessId.mockResolvedValue([
                {
                    id: "report1",
                    generatedAt: new Date("2025-01-01"),
                    competitors: [
                        { name: "Test Business", rating: 4.0 }, // Same name as business
                        { name: "Comp 2", rating: 4.5 }
                    ],
                    businessRating: 4.5 // Should use this value, not 4.0 from competitor
                }
            ]);

            const res = await request(app).get("/api/trends/biz1");

            expect(res.status).toBe(200);
            expect(res.body[0].businessRating).toBe(4.5);
        });

        it("should fallback to matching competitor rating when businessRating is null", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz1",
                userId: "user1",
                name: "Test Business",
                rating: 3.5
            });

            mockStorage.getReportsByBusinessId.mockResolvedValue([
                {
                    id: "report1",
                    generatedAt: new Date("2025-01-01"),
                    competitors: [
                        { name: "Test Business", rating: 4.0 }, // Match by name
                        { name: "Comp 2", rating: 4.5 }
                    ],
                    businessRating: null // No stored rating, should fallback
                }
            ]);

            const res = await request(app).get("/api/trends/biz1");

            expect(res.status).toBe(200);
            expect(res.body[0].businessRating).toBe(4.0); // From competitor match
        });

        it("should fallback to business.rating when no match found", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz1",
                userId: "user1",
                name: "Test Business",
                rating: 3.8
            });

            mockStorage.getReportsByBusinessId.mockResolvedValue([
                {
                    id: "report1",
                    generatedAt: new Date("2025-01-01"),
                    competitors: [
                        { name: "Other Comp", rating: 4.0 },
                        { name: "Comp 2", rating: 4.5 }
                    ],
                    businessRating: null
                }
            ]);

            const res = await request(app).get("/api/trends/biz1");

            expect(res.status).toBe(200);
            expect(res.body[0].businessRating).toBe(3.8); // From business.rating
        });

        it("should require pro plan", async () => {
            currentUser = mockEssentialUser;

            mockStorage.getBusiness.mockResolvedValue({
                id: "biz1",
                userId: "user2",
                name: "Test Business"
            });

            const res = await request(app).get("/api/trends/biz1");

            expect(res.status).toBe(403);
            expect(res.body.code).toBe("PRO_REQUIRED");
        });

        it("should prevent accessing another user's business trends", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz1",
                userId: "other-user", // Different user
                name: "Other Business"
            });

            const res = await request(app).get("/api/trends/biz1");

            expect(res.status).toBe(403);
        });

        it("should return 404 for non-existent business", async () => {
            mockStorage.getBusiness.mockResolvedValue(null);

            const res = await request(app).get("/api/trends/non-existent");

            expect(res.status).toBe(404);
        });
    });
});

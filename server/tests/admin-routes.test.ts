import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerAdminRoutes } from "../routes/admin";
import request from "supertest";

// Mock storage
const { mockStorage } = vi.hoisted(() => ({
    mockStorage: {
        listBusinesses: vi.fn(),
        listAllReports: vi.fn(),
        listUsers: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        getSearchStats: vi.fn(),
        listRecentSearches: vi.fn(),
        getApiUsageStats: vi.fn(),
        getApiUsageByUser: vi.fn()
    }
}));

vi.mock("../storage", () => ({
    storage: mockStorage
}));

// Mock seed
vi.mock("../seed", () => ({
    seed: vi.fn()
}));

const app = express();
app.use(express.json());

// Mock auth middleware
const mockUser = {
    id: "admin-1",
    role: "admin",
    isAuthenticated: () => true
};

app.use((req: any, res, next) => {
    req.user = mockUser;
    req.isAuthenticated = mockUser.isAuthenticated;
    next();
});

registerAdminRoutes(app);

describe("Admin Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/admin/stats", () => {
        it("should return stats", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);
            mockStorage.listAllReports.mockResolvedValue([]);
            mockStorage.listUsers.mockResolvedValue([]);

            const res = await request(app).get("/api/admin/stats");

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                totalUsers: 0,
                totalBusinesses: 0,
                totalReports: 0,
                recentReports: []
            });
        });

        it("should handle error", async () => {
            mockStorage.listBusinesses.mockRejectedValue(new Error("DB error"));

            const res = await request(app).get("/api/admin/stats");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/admin/users", () => {
        it("should return users", async () => {
            mockStorage.listUsers.mockResolvedValue([{ id: "1" }]);

            const res = await request(app).get("/api/admin/users");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe("PATCH /api/admin/users/:id/role", () => {
        it("should update user role", async () => {
            mockStorage.getUser.mockResolvedValue({ id: "user-1" });
            mockStorage.updateUser.mockResolvedValue({ id: "user-1", role: "admin" });

            const res = await request(app)
                .patch("/api/admin/users/user-1/role")
                .send({ role: "admin" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Role updated");
        });

        it("should reject invalid role", async () => {
            const res = await request(app)
                .patch("/api/admin/users/user-1/role")
                .send({ role: "invalid" });

            expect(res.status).toBe(400);
        });

        it("should return 404 if user not found", async () => {
            mockStorage.getUser.mockResolvedValue(null);

            const res = await request(app)
                .patch("/api/admin/users/user-1/role")
                .send({ role: "admin" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/admin/users/:id", () => {
        it("should delete user", async () => {
            mockStorage.deleteUser.mockResolvedValue(true);

            const res = await request(app).delete("/api/admin/users/user-2");

            expect(res.status).toBe(200);
        });

        it("should prevent deleting self", async () => {
            const res = await request(app).delete("/api/admin/users/admin-1");

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Cannot delete yourself");
        });
    });

    describe("GET /api/admin/analytics", () => {
        it("should return analytics data", async () => {
            mockStorage.listUsers.mockResolvedValue([]);
            mockStorage.listAllReports.mockResolvedValue([]);
            mockStorage.getSearchStats.mockResolvedValue({});

            const res = await request(app).get("/api/admin/analytics");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("userGrowth");
            expect(res.body).toHaveProperty("reportStats");
        });
    });

    describe("Access Control", () => {
        it("should forbid non-admin users", async () => {
            mockUser.role = "user"; // Temporarily change role

            const res = await request(app).get("/api/admin/stats");

            mockUser.role = "admin"; // Reset
            expect(res.status).toBe(403);
        });
    });
});

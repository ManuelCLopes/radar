import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerAdminRoutes } from "../routes/admin";
import request from "supertest";

// Mock storage
const { mockStorage } = vi.hoisted(() => ({
    mockStorage: {
        getAdminOverviewRows: vi.fn(),
        listUsers: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        listRecentSearches: vi.fn(),
        listApiUsageSince: vi.fn(),
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

    describe("GET /api/admin/overview", () => {
        it("should return the overview built from storage rows", async () => {
            mockStorage.getAdminOverviewRows.mockResolvedValue({ users: [], reports: [], businessCount: 0, previewSearches: 0 });

            const res = await request(app).get("/api/admin/overview");

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                periodDays: 30,
                users: { total: 0 },
                reports: { total: 0 },
                businesses: { total: 0 },
            });
        });

        it("should handle error", async () => {
            mockStorage.getAdminOverviewRows.mockRejectedValue(new Error("DB error"));

            const res = await request(app).get("/api/admin/overview");

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

        it("should not let admins remove their own admin role", async () => {
            const res = await request(app)
                .patch("/api/admin/users/admin-1/role")
                .send({ role: "user" });

            expect(res.status).toBe(400);
            expect(mockStorage.updateUser).not.toHaveBeenCalled();
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

    describe("GET /api/admin/usage", () => {
        it("should summarise API usage by service", async () => {
            mockStorage.listApiUsageSince.mockResolvedValue([
                { createdAt: new Date(), service: "google_places", tokens: null },
                { createdAt: new Date(), service: "openai", tokens: 1200 },
            ]);

            const res = await request(app).get("/api/admin/usage");

            expect(res.status).toBe(200);
            expect(res.body.daily).toHaveLength(30);
            expect(res.body.totals).toEqual({ googleCalls: 1, openAiCalls: 1, openAiTokens: 1200 });
        });
    });

    describe("GET /api/admin/usage/users", () => {
        it("should clamp the requested limit", async () => {
            mockStorage.getApiUsageByUser.mockResolvedValue([]);

            await request(app).get("/api/admin/usage/users?limit=5000");
            expect(mockStorage.getApiUsageByUser).toHaveBeenLastCalledWith(100);

            await request(app).get("/api/admin/usage/users?limit=abc");
            expect(mockStorage.getApiUsageByUser).toHaveBeenLastCalledWith(10);
        });
    });

    describe("Access Control", () => {
        it("should forbid non-admin users", async () => {
            mockUser.role = "user"; // Temporarily change role

            const res = await request(app).get("/api/admin/overview");

            mockUser.role = "admin"; // Reset
            expect(res.status).toBe(403);
        });
    });
});

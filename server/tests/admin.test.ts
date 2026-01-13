
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerAdminRoutes } from "../routes/admin";
import { storage } from "../storage";

// Mock storage
vi.mock("../storage", () => ({
    storage: {
        listBusinesses: vi.fn(),
        listAllReports: vi.fn(),
        listUsers: vi.fn(),
    },
}));

// Helper to create app with mocked auth
function createApp(userRole?: string) {
    const app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req: any, res, next) => {
        req.isAuthenticated = () => !!userRole;
        if (userRole) {
            req.user = { role: userRole };
        }
        next();
    });

    registerAdminRoutes(app);
    return app;
}

describe("Admin API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should deny access to unauthenticated users", async () => {
        const app = createApp(undefined); // No user
        const res = await request(app).get("/api/admin/stats");
        expect(res.status).toBe(403);
    });

    it("should deny access to non-admin users", async () => {
        const app = createApp("user");
        const res = await request(app).get("/api/admin/stats");
        expect(res.status).toBe(403);
    });

    it("should allow access to admin users and return stats", async () => {
        const app = createApp("admin");

        (storage.listBusinesses as any).mockResolvedValue([{}, {}]); // 2 businesses
        (storage.listAllReports as any).mockResolvedValue([{}, {}, {}]); // 3 reports
        (storage.listUsers as any).mockResolvedValue([{}, {}, {}, {}]); // 4 users

        const res = await request(app).get("/api/admin/stats");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            totalBusinesses: 2,
            totalReports: 3,
            totalUsers: 4,
            recentReports: [{}, {}, {}], // mock returns 3, slice(0,5) returns all 3
        });
    });

    it("should allow admin users to list users", async () => {
        const app = createApp("admin");
        const mockUsers = [{ id: 1, role: "user" }, { id: 2, role: "admin" }];
        (storage.listUsers as any).mockResolvedValue(mockUsers);

        const res = await request(app).get("/api/admin/users");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockUsers);
    });
});

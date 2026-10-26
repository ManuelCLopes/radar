
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerAdminRoutes } from "../routes/admin";
import { storage } from "../storage";

// Mock storage
vi.mock("../storage", () => ({
    storage: {
        getAdminOverviewRows: vi.fn(),
        listUsers: vi.fn(),
        listBillingWaitlistLeads: vi.fn(),
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
        const res = await request(app).get("/api/admin/overview");
        expect(res.status).toBe(403);
    });

    it("should deny access to non-admin users", async () => {
        const app = createApp("user");
        const res = await request(app).get("/api/admin/overview");
        expect(res.status).toBe(403);
    });

    it("should allow access to admin users and return the overview", async () => {
        const app = createApp("admin");

        (storage.getAdminOverviewRows as any).mockResolvedValue({
            users: [{ createdAt: new Date(), plan: "pro", role: "admin", isVerified: true }],
            reports: [
                { generatedAt: new Date(), userId: null, businessId: "b1", status: "completed", competitorCount: 4, businessType: "cafe" },
                { generatedAt: new Date(), userId: "u1", businessId: null, status: "failed", competitorCount: 0, businessType: null },
            ],
            businessCount: 2,
            previewSearches: 7,
        });

        const res = await request(app).get("/api/admin/overview");

        expect(res.status).toBe(200);
        expect(res.body.users.total).toBe(1);
        expect(res.body.reports).toMatchObject({ total: 1, scheduled: 1, guestPreviews: 7, failed: 1 });
        expect(res.body.businesses.total).toBe(2);
        expect(res.body.series).toHaveLength(30);
    });

    it("should allow admin users to list users", async () => {
        const app = createApp("admin");
        const mockUsers = [{ id: 1, role: "user" }, { id: 2, role: "admin" }];
        (storage.listUsers as any).mockResolvedValue(
            mockUsers.map((u) => ({ ...u, passwordHash: "secret-hash", verificationToken: "tok", stripeCustomerId: "cus" })),
        );

        const res = await request(app).get("/api/admin/users");

        expect(res.status).toBe(200);
        // Credentials and billing identifiers never reach the browser.
        expect(res.body).toEqual(mockUsers);
    });

    it("should allow admin users to list billing waitlist leads", async () => {
        const app = createApp("admin");
        const mockLeads = [
            { id: "lead_1", email: "lead@example.com", plan: "pro", message: null, source: "pricing_modal" },
        ];
        (storage.listBillingWaitlistLeads as any).mockResolvedValue(mockLeads);

        const res = await request(app).get("/api/admin/billing-waitlist");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockLeads);
    });
});

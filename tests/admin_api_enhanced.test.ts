
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { registerAdminRoutes } from "../server/routes/admin";
import { storage } from "../server/storage";
import { createServer } from "http";

describe("Enhanced Admin API", () => {
    let app: express.Express;
    let server: any;
    let agent: any;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(
            session({
                secret: "test-secret",
                resave: false,
                saveUninitialized: false,
            })
        );
        app.use(passport.initialize());
        app.use(passport.session());

        // Mock authentication
        app.use((req, res, next) => {
            req.isAuthenticated = () => true;
            req.user = { id: "admin-id", role: "admin" } as any;
            next();
        });

        registerAdminRoutes(app);
        server = createServer(app);
        agent = request.agent(server);

        // Seed some data
        if (storage.trackSearch) {
            // Create user first to satisfy foreign key constraint
            const user = await storage.upsertUser({
                email: `admin_test_${Date.now()}@example.com`,
                passwordHash: "password",
                role: "user",
                firstName: "AdminTest",
                lastName: "User",
                plan: "free"
            } as any);

            await storage.trackSearch({
                type: "restaurant",
                address: "Lisbon",
                radius: 5000,
                competitorsFound: 5,
                latitude: 38.7223,
                longitude: -9.1393,
                userId: user.id
            });
        }
    });

    afterAll((done) => {
        server.close(done);
    });

    it("GET /api/admin/analytics returns user growth and report stats", async () => {
        const res = await agent.get("/api/admin/analytics");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("userGrowth");
        expect(res.body).toHaveProperty("reportStats");
        expect(Array.isArray(res.body.userGrowth)).toBe(true);

        // Extended Stats verification
        expect(res.body).toHaveProperty("typeDistribution");
        expect(res.body).toHaveProperty("topLocations");
        expect(res.body).toHaveProperty("avgCompetitors");
        expect(res.body).toHaveProperty("conversionRate");

        // Since we seeded one restaurant search with 5 competitors
        const types = res.body.typeDistribution;
        expect(types).toEqual(expect.arrayContaining([expect.objectContaining({ type: "restaurant" })]));

        expect(typeof res.body.avgCompetitors).toBe('number');
    });

    it("GET /api/admin/searches returns recent searches", async () => {
        const res = await agent.get("/api/admin/searches");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // Might be empty if trackSearch didn't run or memory cleared, but structure should be correct
    });

    it("PATCH /api/admin/users/:id/role updates user role", async () => {
        // Create a dummy user first
        const user = await storage.upsertUser({
            email: "testrole@example.com",
            passwordHash: "password",
            role: "user",
            plan: "free",
            language: "pt"
        } as any);

        const res = await agent.patch(`/api/admin/users/${user.id}/role`)
            .send({ role: "admin" });

        expect(res.status).toBe(200);

        const updatedUser = await storage.getUser(user.id);
        expect(updatedUser?.role).toBe("admin");
    });

    it("DELETE /api/admin/users/:id deletes a user", async () => {
        // Create a dummy user
        const user = await storage.upsertUser({
            email: "delete@example.com",
            passwordHash: "password",
            role: "user",
            plan: "free",
            language: "pt"
        } as any);

        const res = await agent.delete(`/api/admin/users/${user.id}`);
        expect(res.status).toBe(200);

        const deletedUser = await storage.getUser(user.id);
        expect(deletedUser).toBeUndefined();
    });
});

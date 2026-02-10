
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { registerAdminRoutes } from "../server/routes/admin";
import { storage } from "../server/storage";
import { createServer } from "http";

describe("API Usage Monitor", () => {
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

        // Seed some usage data
        await storage.trackApiUsage({
            service: 'google_places',
            endpoint: 'textSearch',
            costUnits: 1
        });
        await storage.trackApiUsage({
            service: 'google_places',
            endpoint: 'nearbySearch',
            costUnits: 3
        });
        await storage.trackApiUsage({
            service: 'openai',
            endpoint: 'chatCompletions',
            tokens: 1500,
            costUnits: 2
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    it("GET /api/admin/usage returns aggregated usage stats", async () => {
        const res = await agent.get("/api/admin/usage");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Find today's entry
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntry = res.body.find((e: any) => e.date === todayStr);

        expect(todayEntry).toBeDefined();
        // Google calls: 1 + 3 = 4 cost units
        expect(todayEntry.google).toBeGreaterThanOrEqual(4);
        // OpenAI: 1500 tokens
        expect(todayEntry.openAi).toBeGreaterThanOrEqual(1500);
    });

    it("GET /api/admin/usage/users returns top consumers", async () => {
        // Create a user and track some usage
        const user = await storage.upsertUser({
            email: "bigspender@example.com",
            passwordHash: "password",
            role: "user",
            firstName: "Big",
            lastName: "Spender"
        } as any);

        await storage.trackApiUsage({
            service: 'openai',
            endpoint: 'chatCompletions',
            tokens: 5000,
            costUnits: 5,
            userId: user.id
        });

        const res = await agent.get("/api/admin/usage/users");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const spender = res.body.find((u: any) => u.userId === user.id);
        expect(spender).toBeDefined();
        expect(Number(spender.totalCost)).toBeGreaterThanOrEqual(5);
        expect(spender.firstName).toBe("Big");
    });
});

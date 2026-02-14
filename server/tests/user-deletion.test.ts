// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import { setupAuth } from "../auth";

describe("User Deletion API", () => {
    let app: express.Express;
    let server: any;
    let mockUser: any = null;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // Mock session middleware
        const session = require("express-session");
        app.use(session({
            secret: "test-secret",
            resave: false,
            saveUninitialized: false,
        }));

        // Mock passport to simulate authenticated user
        app.use((req: any, res, next) => {
            req.user = mockUser;
            req.isAuthenticated = () => !!req.user;
            req.logout = (cb: any) => {
                req.user = null;
                mockUser = null; // Also clear mockUser
                cb(null);
            };
            next();
        });

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    beforeEach(() => {
        mockUser = null;
    });

    it("should delete user and associated data", async () => {
        // 1. Create a user
        const user = await storage.upsertUser({
            email: "delete_me@example.com",
            passwordHash: "hash",
            firstName: "Delete",
            lastName: "Me"
        });

        // 2. Create a business for this user
        await storage.addBusiness({
            userId: user.id,
            name: "Test Business",
            type: "restaurant",
            address: "123 Test St",
            latitude: 40.7128,
            longitude: -74.0060,
            locationStatus: "validated",
        });

        // 3. Create a report for this user
        await storage.createReport({
            userId: user.id,
            businessName: "Test Business",
            competitors: [],
            aiAnalysis: "Test Analysis",
            html: "<html></html>"
        });

        // 4. Create a search for this user
        await storage.trackSearch!({
            userId: user.id,
            address: "Test Address",
            type: "restaurant",
            radius: 1000
        });

        // 5. Create API usage for this user
        await storage.trackApiUsage({
            service: "openai",
            endpoint: "analyze",
            userId: user.id,
            tokens: 10,
            costUnits: 2
        });

        // 6. Create password reset token
        await storage.createPasswordResetToken({
            userId: user.id,
            token: "token-123",
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        });

        // 7. Verify data exists
        expect(await storage.getUser(user.id)).toBeDefined();
        expect((await storage.listBusinesses(user.id)).length).toBe(1);
        expect((await storage.getReportsByUserId(user.id)).length).toBe(1);
        expect((await storage.listSearchesByUserId(user.id)).length).toBe(1);
        expect((await storage.listApiUsageByUserId(user.id)).length).toBe(1);
        expect(await storage.getPasswordResetToken("token-123")).toBeDefined();

        // 8. Call DELETE /api/user
        mockUser = user; // Set logged in user
        const res = await request(app).delete("/api/user");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Account deleted successfully");

        // 9. Verify data is gone
        expect(await storage.getUser(user.id)).toBeUndefined();
        expect((await storage.listBusinesses(user.id)).length).toBe(0);
        expect((await storage.getReportsByUserId(user.id)).length).toBe(0);
        expect((await storage.listSearchesByUserId(user.id)).length).toBe(0);
        expect((await storage.listApiUsageByUserId(user.id)).length).toBe(0);
        expect(await storage.getPasswordResetToken("token-123")).toBeUndefined();
    });

    it("should return 401 if not authenticated", async () => {
        const res = await request(app).delete("/api/user");
        expect(res.status).toBe(401);
    });
});

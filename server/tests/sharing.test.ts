// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import { insertReportSchema } from "@shared/schema";

// Mock OpenAI
vi.mock("../ai", () => ({
    analyzeCompetitors: vi.fn(),
}));

// Mock Google Places
vi.mock("../googlePlaces", () => ({
    searchPlacesByAddress: vi.fn(),
    hasGoogleApiKey: vi.fn().mockReturnValue(true),
    searchNearby: vi.fn(),
}));

describe("Sharing API", () => {
    let app: express.Express;
    let server: any;
    let userId: string;
    let reportId: string;
    let shareToken: string;

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

        // Create a test user
        const user = await storage.upsertUser({
            email: `sharing_test_${Date.now()}@example.com`,
            passwordHash: "password",
            firstName: "Sharing",
            lastName: "Test",
            provider: "local",
            plan: "essential"
        });
        userId = user.id.toString();

        // Create a test report directly in storage
        const reportData = {
            userId: userId,
            businessName: "Sharing Test Business",
            address: "123 Share St",
            location: { lat: 0, lng: 0 },
            radius: 1000,
            competitors: [],
            aiAnalysis: "Test Analysis",
            swotAnalysis: {},
            marketTrends: [],
            targetAudience: {},
            marketingStrategy: {},
            generatedAt: new Date().toISOString(),
            isShared: false,
            shareToken: null
        };
        const report = await storage.createReport(reportData);
        reportId = report.id.toString();

        // Mock authentication middleware
        app.use((req: any, res, next) => {
            req.isAuthenticated = () => true;
            req.user = { id: userId };
            next();
        });

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    afterAll(() => {
        // Cleanup if needed
    });

    describe("POST /api/reports/:id/share", () => {
        it("should enable sharing and generate a token", async () => {
            const res = await request(app)
                .post(`/api/reports/${reportId}/share`)
                .send({ isShared: true });

            expect(res.status).toBe(200);
            expect(res.body.isShared).toBe(true);
            expect(res.body.shareToken).toBeDefined();
            expect(typeof res.body.shareToken).toBe("string");

            shareToken = res.body.shareToken;
        });

        it("should disable sharing", async () => {
            const res = await request(app)
                .post(`/api/reports/${reportId}/share`)
                .send({ isShared: false });

            expect(res.status).toBe(200);
            expect(res.body.isShared).toBe(false);
            // Token might persist or be null depending on implementation, 
            // but isShared must be false
        });

        it("should re-enable sharing and reuse/generate token", async () => {
            const res = await request(app)
                .post(`/api/reports/${reportId}/share`)
                .send({ isShared: true });

            expect(res.status).toBe(200);
            expect(res.body.isShared).toBe(true);
            expect(res.body.shareToken).toBeDefined();
            // Update token for next tests
            shareToken = res.body.shareToken;
        });
    });

    describe("GET /api/reports/public/:token", () => {
        it("should retrieve a shared report", async () => {
            const res = await request(app)
                .get(`/api/reports/public/${shareToken}`);

            expect(res.status).toBe(200);
            expect(res.body.businessName).toBe("Sharing Test Business");
            expect(res.body.aiAnalysis).toBe("Test Analysis");
            // Ensure sensitive data is not leaked (though currently schema allows it, 
            // route should probably filter it or we check what's returned)
            // Ideally userId is not returned or is null/undefined in the public DTO if we had one.
            // But we didn't implement a specific DTO, we just return the report. 
            // Let's check if the route implementation excludes it. 
            // Checking the route implementation (I recalled viewing it):
            // It does `const { userId, ...publicReport } = report; return res.json(publicReport);`
            expect(res.body.userId).toBeUndefined();
        });

        it("should return 404 for invalid token", async () => {
            const res = await request(app)
                .get(`/api/reports/public/invalid-token-123`);

            expect(res.status).toBe(404);
        });

        it("should return 404 (or 404-like) if sharing is disabled", async () => {
            // Disable sharing first
            await request(app)
                .post(`/api/reports/${reportId}/share`)
                .send({ isShared: false });

            // Try to access
            const res = await request(app)
                .get(`/api/reports/public/${shareToken}`);

            expect(res.status).toBe(404);
        });
    });
});

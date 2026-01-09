// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";

// Mock OpenAI
vi.mock("../ai", () => ({
    analyzeCompetitors: vi.fn().mockResolvedValue({
        swot: { strengths: ["Strong brand"], weaknesses: ["High price"], opportunities: ["Expansion"], threats: ["Competition"] },
        marketTrends: ["Digital transformation", "Remote work"],
        targetAudience: { demographics: ["Age 25-34"], psychographics: ["Tech-savvy"], painPoints: ["Lack of time"] },
        marketingStrategy: { primaryChannels: ["Social Media"], contentIdeas: ["Video tutorials"], promotionalTactics: ["Discounts"] },
        customerSentiment: { commonPraises: ["Great UI"], recurringComplaints: ["Slow support"], unmetNeeds: ["Mobile app"] }
    }),
}));

// Mock Google Places
vi.mock("../googlePlaces", () => ({
    searchPlacesByAddress: vi.fn().mockResolvedValue([{
        latitude: 38.7223,
        longitude: -9.1393,
        name: "Test Location",
        address: "Test Address, City"
    }]),
    hasGoogleApiKey: vi.fn().mockReturnValue(true),
    searchNearby: vi.fn().mockResolvedValue([
        { name: "Competitor 1", address: "Address 1", rating: 4.5, userRatingsTotal: 100, priceLevel: "$$" },
        { name: "Competitor 2", address: "Address 2", rating: 4.0, userRatingsTotal: 50, priceLevel: "$" }
    ]),
}));

describe("Reports API", () => {
    let app: express.Express;
    let server: any;
    let userId: string;

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

        // Create a test user first
        const user = await storage.upsertUser({
            email: "reports_test@example.com",
            passwordHash: "password",
            firstName: "Reports",
            lastName: "Test",
            provider: "local",
            plan: "essential"
        });
        userId = user.id.toString();

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
        // Cleanup
    });

    describe("POST /api/quick-search", () => {
        it("should perform a quick search without authentication", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({
                    address: "Quick Search Address",
                    radius: 1000,
                    type: "restaurant"
                });

            expect(res.status).toBe(200);
            expect(res.status).toBe(200);
            expect(res.body.report).toBeDefined();
            expect(res.body.report.competitors).toBeDefined();
            expect(res.body.report.swotAnalysis).toBeDefined();
            expect(res.body.report.marketTrends).toBeDefined();
        });

        it("should validate required fields", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({
                    address: "", // Missing address
                    radius: 1000,
                    type: "restaurant"
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });
    });
    describe("POST /api/analyze-address", () => {
        it("should generate a report for an address", async () => {
            const res = await request(app)
                .post("/api/analyze-address")
                .send({
                    address: "Test Address, City",
                    radius: 1000,
                    type: "restaurant"
                });

            expect(res.status).toBe(200);
            expect(res.body.businessName).toContain("Test Address");
            expect(res.body.aiAnalysis).toBeDefined();
            expect(res.body.swotAnalysis).toBeDefined();
            expect(res.body.marketTrends).toBeDefined();
        });
    });

    describe("GET /api/reports/history", () => {
        it("should retrieve report history", async () => {
            const res = await request(app)
                .get("/api/reports/history");

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            // Should contain at least the report created above
            expect(res.body.length).toBeGreaterThan(0);
        });
    });
});

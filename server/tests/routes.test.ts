
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";

// Mock dependencies
vi.mock("../googlePlaces", () => ({
    searchPlacesByAddress: vi.fn(),
    hasGoogleApiKey: vi.fn(),
}));

vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn(),
}));

import { searchPlacesByAddress, hasGoogleApiKey } from "../googlePlaces";
import { runReportForBusiness } from "../reports";

describe("API Routes Integration", () => {
    let app: express.Express;
    let server: any;

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

        // Mock passport for authentication
        const passport = require("passport");
        app.use(passport.initialize());
        app.use(passport.session());

        // Mock user serialization
        passport.serializeUser((user: any, done: any) => done(null, user));
        passport.deserializeUser((user: any, done: any) => done(null, user));

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/quick-search", () => {
        it("should return 400 if required fields are missing", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });

        it("should return 400 for invalid radius", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({
                    address: "Test Address",
                    type: "restaurant",
                    radius: 123 // Invalid radius
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid radius");
        });

        it("should perform quick search successfully", async () => {
            (hasGoogleApiKey as any).mockReturnValue(true);
            (searchPlacesByAddress as any).mockResolvedValue([{
                latitude: 10,
                longitude: 20
            }]);
            (runReportForBusiness as any).mockResolvedValue({
                competitors: [],
                aiAnalysis: "Test analysis"
            });

            const res = await request(app)
                .post("/api/quick-search")
                .send({
                    address: "Test Address",
                    type: "restaurant",
                    radius: 1000
                });

            expect(res.status).toBe(200);
            expect(res.body.preview).toBe(true);
            expect(res.body.location).toEqual({
                address: "Test Address",
                latitude: 10,
                longitude: 20
            });
        });

        it("should handle rate limiting", async () => {
            // Mock successful search setup
            (hasGoogleApiKey as any).mockReturnValue(true);
            (searchPlacesByAddress as any).mockResolvedValue([{ latitude: 10, longitude: 20 }]);
            (runReportForBusiness as any).mockResolvedValue({});

            // Make 5 requests (limit is 5)
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post("/api/quick-search")
                    .send({ address: "Test", type: "test", radius: 1000 });
            }

            // 6th request should fail
            const res = await request(app)
                .post("/api/quick-search")
                .send({ address: "Test", type: "test", radius: 1000 });

            expect(res.status).toBe(429);
            expect(res.body.error).toBe("Rate limit exceeded");
        });
    });

    describe("GET /api/places/search", () => {
        it("should require authentication", async () => {
            const res = await request(app).get("/api/places/search?q=test");
            expect(res.status).toBe(401); // Assuming default unauth behavior
        });
    });
});

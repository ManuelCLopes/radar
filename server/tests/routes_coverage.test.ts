
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import * as reports from "../reports";
import * as googlePlaces from "../googlePlaces";

// Mock dependencies
vi.mock("../storage", () => ({
    storage: {
        trackSearch: vi.fn(),
        listBusinesses: vi.fn(),
        addBusiness: vi.fn(),
        getBusiness: vi.fn(),
        deleteBusiness: vi.fn(),
        updateBusiness: vi.fn(),
        createReport: vi.fn(),
    }
}));

vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn(),
}));

vi.mock("../googlePlaces", () => ({
    searchPlacesByAddress: vi.fn(),
    hasGoogleApiKey: vi.fn(),
}));

// Mock auth
vi.mock("../auth", () => ({
    setupAuth: vi.fn(async (app) => {
        app.use((req: any, res: any, next: any) => {
            req.isAuthenticated = () => true;
            req.user = { id: 1, email: "test@example.com" };
            next();
        });
    }),
    isAuthenticated: (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, email: "test@example.com" };
        next();
    }
}));

describe("Routes Coverage", () => {
    let app: express.Express;
    let server: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    describe("POST /api/quick-search", () => {
        it("should return 400 if required fields missing", async () => {
            const res = await request(app).post("/api/quick-search").send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });

        it("should return 400 if radius invalid", async () => {
            const res = await request(app).post("/api/quick-search").send({
                address: "123 Main St",
                type: "restaurant",
                radius: 123
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid radius");
        });

        it("should return 400 if address not found (no coords)", async () => {
            vi.mocked(googlePlaces.hasGoogleApiKey).mockReturnValue(true);
            vi.mocked(googlePlaces.searchPlacesByAddress).mockResolvedValue([]);

            const res = await request(app).post("/api/quick-search").send({
                address: "Unknown St",
                type: "restaurant",
                radius: 1000
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Address not found");
        });

        it("should perform search and return preview", async () => {
            vi.mocked(googlePlaces.hasGoogleApiKey).mockReturnValue(true);
            vi.mocked(googlePlaces.searchPlacesByAddress).mockResolvedValue([{
                latitude: 10,
                longitude: 20,
                placeId: "123",
                name: "Place",
                address: "Addr"
            }]);
            vi.mocked(reports.runReportForBusiness).mockResolvedValue({
                competitors: [{ name: "Comp 1" }, { name: "Comp 2" }, { name: "Comp 3" }, { name: "Comp 4" }],
                aiAnalysis: "Analysis",
            } as any);

            const res = await request(app).post("/api/quick-search").send({
                address: "123 Main St",
                type: "restaurant",
                radius: 1000
            });

            expect(res.status).toBe(200);
            expect(res.body.preview).toBe(true);
            expect(res.body.competitors).toHaveLength(3); // Preview limit
            expect(storage.trackSearch).toHaveBeenCalled();
        });

        it("should rate limit requests", async () => {
            // Mock rate limit map is internal to routes.ts, hard to test directly without exposing it.
            // But we can send multiple requests.
            // However, supertest creates a new app instance? No, we reuse `app`.
            // But `registerRoutes` creates the map inside.
            // So we need to reuse the same `app` instance for multiple requests.

            // We need to reset the map or use a fresh app for this test if we want to be deterministic.
            // But `beforeEach` creates a fresh app.

            // Let's send 6 requests.
            vi.mocked(googlePlaces.hasGoogleApiKey).mockReturnValue(false); // Skip google search to be faster?
            // If no google key, it fails at coords check?
            // Wait, if !hasGoogleApiKey(), coords is null.
            // Then it returns 400 Address not found.
            // Rate limit check happens BEFORE validation?
            // Yes, lines 30-47.

            for (let i = 0; i < 5; i++) {
                await request(app).post("/api/quick-search").send({});
            }

            const res = await request(app).post("/api/quick-search").send({});
            expect(res.status).toBe(429);
            expect(res.body.error).toBe("Rate limit exceeded");
        });
    });

    describe("POST /api/businesses", () => {
        it("should validate coordinates for validated status", async () => {
            const res = await request(app).post("/api/businesses").send({
                name: "Biz",
                type: "restaurant",
                address: "Addr",
                locationStatus: "validated",
                // Missing lat/lng
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Location coordinates are required");
        });

        it("should validate coordinate range", async () => {
            const res = await request(app).post("/api/businesses").send({
                name: "Biz",
                type: "restaurant",
                address: "Addr",
                locationStatus: "validated",
                latitude: 100, // Invalid
                longitude: 0
            });
            expect(res.status).toBe(400);
            // Zod catches this first
            expect(res.body.error).toBe("Validation failed");
        });
    });

    describe("PUT /api/businesses/:id", () => {
        it("should validate partial update coordinates", async () => {
            const res = await request(app).put("/api/businesses/1").send({
                latitude: 100 // Invalid
            });
            expect(res.status).toBe(400);
            // Zod catches this first
            expect(res.body.error).toBe("Validation failed");
        });
    });

    describe("POST /api/analyze-address", () => {
        it("should analyze address and save report", async () => {
            vi.mocked(googlePlaces.hasGoogleApiKey).mockReturnValue(true);
            vi.mocked(googlePlaces.searchPlacesByAddress).mockResolvedValue([{
                latitude: 10,
                longitude: 20,
                placeId: "123",
                name: "Place",
                address: "Addr"
            }]);
            vi.mocked(reports.runReportForBusiness).mockResolvedValue({
                id: "rep-1",
                generatedAt: new Date(),
                competitors: [],
                aiAnalysis: "Analysis",
            } as any);
            vi.mocked(storage.createReport).mockResolvedValue({ id: "saved-1" } as any);

            const res = await request(app).post("/api/analyze-address").send({
                address: "123 Main St",
                type: "restaurant",
                radius: 1000
            });

            expect(res.status).toBe(200);
            expect(res.body.id).toBe("saved-1");
            expect(storage.createReport).toHaveBeenCalled();
        });
    });
});

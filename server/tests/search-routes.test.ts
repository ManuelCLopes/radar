// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerSearchRoutes } from "../routes/search";

// Mock dependencies
vi.mock("../storage", () => ({
    storage: {}
}));

vi.mock("../googlePlaces", () => ({
    hasGoogleApiKey: vi.fn(() => true),
    searchPlacesByAddress: vi.fn(() => Promise.resolve([
        { name: "Test Place", latitude: 40.7, longitude: -74.0, address: "123 Test St" }
    ])),
    reverseGeocode: vi.fn(() => Promise.resolve("123 Main St, City"))
}));

vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn(() => Promise.resolve({
        id: "report-1",
        businessName: "Test Business",
        competitors: [],
        aiAnalysis: "Analysis"
    }))
}));

vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        if (req.headers.authorization === "Bearer valid-token") {
            req.user = { id: "1", email: "test@example.com" };
            return next();
        }
        return res.status(401).json({ message: "Unauthorized" });
    }
}));

describe("Search Routes", () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        registerSearchRoutes(app);
        vi.clearAllMocks();
    });

    describe("POST /api/quick-search", () => {
        it("should return 400 if required fields missing", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({ type: "restaurant" });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Missing required fields");
        });

        it("should return 400 if radius is invalid", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({ address: "123 Test St", type: "restaurant", radius: 999 });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Invalid radius");
        });

        it("should perform search with valid address", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({ address: "123 Test St", type: "restaurant", radius: 1000 });

            expect(res.status).toBe(200);
            expect(res.body.report).toBeDefined();
            expect(res.body.searchId).toBeDefined();
        });

        it("should perform search with coordinates", async () => {
            const res = await request(app)
                .post("/api/quick-search")
                .send({ latitude: 40.7, longitude: -74.0, type: "restaurant", radius: 1000 });

            expect(res.status).toBe(200);
            expect(res.body.report).toBeDefined();
        });


    });

    describe("GET /api/places/search", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app).get("/api/places/search?q=test");

            expect(res.status).toBe(401);
        });

        it("should return 400 if query missing", async () => {
            const res = await request(app)
                .get("/api/places/search")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("required");
        });

        it("should return results with valid query", async () => {
            const res = await request(app)
                .get("/api/places/search?q=restaurant")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(200);
            expect(res.body.results).toBeDefined();
            expect(res.body.apiKeyMissing).toBe(false);
        });

        it("should indicate when API key is missing", async () => {
            const { hasGoogleApiKey } = await import("../googlePlaces");
            (hasGoogleApiKey as any).mockReturnValue(false);

            const res = await request(app)
                .get("/api/places/search?q=restaurant")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(200);
            expect(res.body.apiKeyMissing).toBe(true);
            expect(res.body.results).toEqual([]);
        });
    });

    describe("GET /api/google-places/status", () => {
        it("should return configured status", async () => {
            const { hasGoogleApiKey } = await import("../googlePlaces");
            (hasGoogleApiKey as any).mockReturnValue(true);

            const res = await request(app).get("/api/google-places/status");

            expect(res.status).toBe(200);
            expect(res.body.configured).toBe(true);
        });

        it("should return not configured when API key missing", async () => {
            const { hasGoogleApiKey } = await import("../googlePlaces");
            (hasGoogleApiKey as any).mockReturnValue(false);

            const res = await request(app).get("/api/google-places/status");

            expect(res.status).toBe(200);
            expect(res.body.configured).toBe(false);
        });
    });

    describe("POST /api/places/reverse-geocode", () => {
        it("should return 400 if coordinates missing", async () => {
            const res = await request(app)
                .post("/api/places/reverse-geocode")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("required");
        });

        it("should return address with valid coordinates", async () => {
            const { hasGoogleApiKey } = await import("../googlePlaces");
            (hasGoogleApiKey as any).mockReturnValue(true);

            const res = await request(app)
                .post("/api/places/reverse-geocode")
                .send({ latitude: 40.7, longitude: -74.0 });

            expect(res.status).toBe(200);
            expect(res.body.address).toBe("123 Main St, City");
        });

        it("should return fallback when API key missing", async () => {
            const { hasGoogleApiKey } = await import("../googlePlaces");
            (hasGoogleApiKey as any).mockReturnValue(false);

            const res = await request(app)
                .post("/api/places/reverse-geocode")
                .send({ latitude: 40.7, longitude: -74.0 });

            expect(res.status).toBe(200);
            expect(res.body.address).toContain("Current Location");
        });

        it("should return 404 if address not found", async () => {
            const { hasGoogleApiKey, reverseGeocode } = await import("../googlePlaces");
            (hasGoogleApiKey as any).mockReturnValue(true);
            (reverseGeocode as any).mockResolvedValue(null);

            const res = await request(app)
                .post("/api/places/reverse-geocode")
                .send({ latitude: 40.7, longitude: -74.0 });

            expect(res.status).toBe(404);
        });
    });
});

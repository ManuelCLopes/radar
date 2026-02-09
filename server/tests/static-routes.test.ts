// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerStaticRoutes } from "../routes/static";

describe("Static Routes", () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        registerStaticRoutes(app);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /robots.txt", () => {
        it("should return robots.txt content", async () => {
            const res = await request(app).get("/robots.txt");

            expect(res.status).toBe(200);
            expect(res.type).toBe("text/plain");
            expect(res.text).toContain("User-agent: *");
            expect(res.text).toContain("Allow: /");
            expect(res.text).toContain("Disallow: /dashboard");
            expect(res.text).toContain("Disallow: /api/");
            expect(res.text).toContain("Sitemap:");
        });
    });

    describe("GET /sitemap.xml", () => {
        it("should return sitemap XML content", async () => {
            const res = await request(app).get("/sitemap.xml");

            expect(res.status).toBe(200);
            expect(res.type).toBe("application/xml");
            expect(res.text).toContain("urlset");
            expect(res.text).toContain("competitorwatcher.pt");
            expect(res.text).toContain("<loc>");
        });
    });

    describe("GET /api/static-map", () => {
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = { ...originalEnv };
            global.fetch = vi.fn();
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it("should return 500 if API key not configured", async () => {
            delete process.env.GOOGLE_API_KEY;

            const res = await request(app).get("/api/static-map?center=10,20");

            expect(res.status).toBe(500);
            expect(res.text).toContain("Google API Key not configured");
        });

        it("should return 400 if center not provided", async () => {
            process.env.GOOGLE_API_KEY = "test-key";

            const res = await request(app).get("/api/static-map");

            expect(res.status).toBe(400);
            expect(res.text).toContain("Center is required");
        });

        it("should fetch and return static map image", async () => {
            process.env.GOOGLE_API_KEY = "test-key";
            const mockImageBuffer = Buffer.from("mock-image-data");

            (global.fetch as any).mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockImageBuffer)
            });

            const res = await request(app).get("/api/static-map?center=40.7,-74.0");

            expect(res.status).toBe(200);
            expect(res.type).toBe("image/png");
            expect(global.fetch).toHaveBeenCalled();
        });

        it("should include competitor markers when provided", async () => {
            process.env.GOOGLE_API_KEY = "test-key";
            const mockImageBuffer = Buffer.from("mock-image-data");

            (global.fetch as any).mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockImageBuffer)
            });

            await request(app).get("/api/static-map?center=40.7,-74.0&markers=41.0,-73.5|40.5,-74.5");

            expect(global.fetch).toHaveBeenCalled();
            const fetchUrl = (global.fetch as any).mock.calls[0][0];
            expect(fetchUrl).toContain("markers=color:red");
        });

        it("should handle API error", async () => {
            process.env.GOOGLE_API_KEY = "test-key";

            (global.fetch as any).mockResolvedValue({
                ok: false,
                statusText: "Bad Request"
            });

            const res = await request(app).get("/api/static-map?center=40.7,-74.0");

            expect(res.status).toBe(500);
            expect(res.text).toContain("Failed to fetch map");
        });

        it("should handle network error", async () => {
            process.env.GOOGLE_API_KEY = "test-key";

            (global.fetch as any).mockRejectedValue(new Error("Network error"));

            const res = await request(app).get("/api/static-map?center=40.7,-74.0");

            expect(res.status).toBe(500);
            expect(res.text).toContain("Failed to fetch map");
        });
    });

    describe("GET /api/debug-connectivity", () => {
        it("should return connectivity results", async () => {
            const res = await request(app).get("/api/debug-connectivity");

            expect(res.status).toBe(200);
            expect(res.body.timestamp).toBeDefined();
            expect(res.body.results).toBeInstanceOf(Array);
            expect(res.body.results.length).toBe(3);
            expect(res.body.env).toBeDefined();
        });
    });
});

// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";

describe("User Export API", () => {
    let app: express.Express;
    let server: any;
    let mockUser: any = null;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        const session = require("express-session");
        app.use(session({
            secret: "test-secret",
            resave: false,
            saveUninitialized: false,
        }));

        app.use((req: any, res, next) => {
            req.user = mockUser;
            req.isAuthenticated = () => !!req.user;
            req.logout = (cb: any) => cb(null);
            next();
        });

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    beforeEach(() => {
        mockUser = null;
    });

    it("should export user data", async () => {
        const user = await storage.upsertUser({
            email: "export_me@example.com",
            passwordHash: "hash",
            firstName: "Export",
            lastName: "Me"
        });

        await storage.addBusiness({
            userId: user.id,
            name: "Export Business",
            type: "restaurant",
            address: "123 Export St",
            latitude: 40.7128,
            longitude: -74.0060,
            locationStatus: "validated",
        });

        await storage.createReport({
            userId: user.id,
            businessName: "Export Business",
            competitors: [],
            aiAnalysis: "Export Analysis",
            html: "<html></html>"
        });

        await storage.trackSearch!({
            userId: user.id,
            address: "Export Address",
            type: "restaurant",
            radius: 1000
        });

        await storage.trackApiUsage({
            service: "openai",
            endpoint: "analyze",
            userId: user.id,
            tokens: 10,
            costUnits: 2
        });

        mockUser = user;
        const res = await request(app).get("/api/user/export");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("application/json");

        const payload = JSON.parse(res.text);
        expect(payload.user.email).toBe("export_me@example.com");
        expect(payload.user.passwordHash).toBeUndefined();
        expect(payload.businesses.length).toBe(1);
        expect(payload.reports.length).toBe(1);
        expect(payload.searches.length).toBe(1);
        expect(payload.apiUsage.length).toBe(1);
    });

    it("should return 401 if not authenticated", async () => {
        const res = await request(app).get("/api/user/export");
        expect(res.status).toBe(401);
    });
});

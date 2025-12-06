// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { storage } from "../storage";
import { createServer } from "http";
import session from "express-session";
import MemoryStore from "memorystore";

describe("Business API", () => {
    let app: express.Express;
    let server: any;
    let userId: string;

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        const SessionStore = MemoryStore(session);
        app.use(session({
            secret: "test-secret",
            resave: false,
            saveUninitialized: false,
            store: new SessionStore({ checkPeriod: 86400000 })
        }));

        // Create a test user
        const user = await storage.upsertUser({
            email: "business_test@example.com",
            passwordHash: "password",
            firstName: "Business",
            lastName: "Owner",
            provider: "local",
            plan: "professional"
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
        if (server) server.close();
    });

    describe("POST /api/businesses", () => {
        it("should create a new business", async () => {
            const res = await request(app)
                .post("/api/businesses")
                .send({
                    name: "New Restaurant",
                    type: "restaurant",
                    address: "123 Main St",
                    latitude: 40.7128,
                    longitude: -74.0060
                });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe("New Restaurant");
            expect(res.body.id).toBeDefined();
        });

        it("should validate required fields", async () => {
            const res = await request(app)
                .post("/api/businesses")
                .send({
                    name: "Incomplete Business"
                    // Missing type and address
                });

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/businesses", () => {
        it("should list all businesses", async () => {
            // Create a business first
            await request(app)
                .post("/api/businesses")
                .send({
                    name: "List Test Business",
                    type: "retail",
                    address: "456 Market St",
                    latitude: 40.7128,
                    longitude: -74.0060
                });

            const res = await request(app)
                .get("/api/businesses");

            console.log("GET /api/businesses response:", JSON.stringify(res.body, null, 2));

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body.some((b: any) => b.name === "List Test Business")).toBe(true);
        });
    });

    describe("PUT /api/businesses/:id", () => {
        it("should update an existing business", async () => {
            // Create a business
            const createRes = await request(app)
                .post("/api/businesses")
                .send({
                    name: "Update Test Business",
                    type: "cafe",
                    address: "789 Coffee Ln",
                    latitude: 40.7128,
                    longitude: -74.0060
                });

            const businessId = createRes.body.id;

            // Update it
            const res = await request(app)
                .put(`/api/businesses/${businessId}`)
                .send({
                    name: "Updated Cafe Name",
                    type: "cafe",
                    address: "789 Coffee Ln",
                    latitude: 40.7128,
                    longitude: -74.0060
                });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Updated Cafe Name");

            // Verify update
            const getRes = await request(app).get("/api/businesses");
            const updated = getRes.body.find((b: any) => b.id === businessId);
            expect(updated.name).toBe("Updated Cafe Name");
        });

        it("should return 404 for non-existent business", async () => {
            const res = await request(app)
                .put("/api/businesses/99999")
                .send({
                    name: "Ghost Business",
                    type: "other",
                    address: "Nowhere",
                    latitude: 40.7128,
                    longitude: -74.0060
                });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/businesses/:id", () => {
        it("should delete a business", async () => {
            // Create a business
            const createRes = await request(app)
                .post("/api/businesses")
                .send({
                    name: "Delete Test Business",
                    type: "gym",
                    address: "101 Fitness Blvd",
                    latitude: 40.7128,
                    longitude: -74.0060
                });

            const businessId = createRes.body.id;

            const res = await request(app)
                .delete(`/api/businesses/${businessId}`);

            expect(res.status).toBe(200);

            // Verify deletion
            const getRes = await request(app).get("/api/businesses");
            const deleted = getRes.body.find((b: any) => b.id === businessId);
            expect(deleted).toBeUndefined();
        });
    });
});

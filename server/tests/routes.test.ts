
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

vi.mock("../email", () => ({
    emailService: {
        sendAdHocReport: vi.fn(),
    },
    // We might need these if they are imported elsewhere or used
    generateReportEmail: vi.fn(),
    generatePasswordResetEmail: vi.fn(),
    generateWelcomeEmail: vi.fn(),
    sendEmail: vi.fn(),
}));

// Mock auth state
const authMocks = vi.hoisted(() => ({
    user: null as any
}));

import { searchPlacesByAddress, hasGoogleApiKey } from "../googlePlaces";

import { runReportForBusiness } from "../reports";
import { emailService } from "../email";

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

        // Test auth middleware - runs before routes
        app.use((req: any, res, next) => {
            if (authMocks.user) {
                req.user = authMocks.user;
                req.isAuthenticated = () => true;
            }
            next();
        });

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
        authMocks.user = null;
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
            expect(res.status).toBe(200);
            expect(res.body.report).toBeDefined();
            expect(res.body.searchId).toBeDefined();
            expect(res.body.report.aiAnalysis).toBe("Test analysis");
        });

        it.skip("should handle rate limiting", async () => {
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

    describe("POST /api/analyze-address", () => {
        it("should pass userId to runReportForBusiness", async () => {
            authMocks.user = { id: "test-user-id", plan: "professional" };
            (hasGoogleApiKey as any).mockReturnValue(true);
            (searchPlacesByAddress as any).mockResolvedValue([{
                latitude: 10,
                longitude: 20
            }]);
            (runReportForBusiness as any).mockResolvedValue({
                competitors: [],
                aiAnalysis: "Test analysis",
                businessName: "Test Business",
                generatedAt: new Date(),
                html: "<html></html>"
            });
            // Mock storage.createReport since analyze-address calls it
            vi.spyOn(storage, "createReport").mockResolvedValue({} as any);

            const res = await request(app)
                .post("/api/analyze-address")
                .send({
                    address: "Test Address",
                    type: "restaurant",
                    radius: 1000
                });

            expect(res.status).toBe(200);
            expect(runReportForBusiness).toHaveBeenCalledWith(
                expect.stringMatching(/^analysis-/), // temp business id
                "en",
                expect.objectContaining({
                    name: "Test Address",
                    type: "restaurant",
                    address: "Test Address"
                }),
                "test-user-id", // Verify userId is passed
                1000 // Verify radius is passed
            );
        });
    });
});

describe("Routes Coverage (Edge Cases)", () => {
    let app: express.Express;
    let server: any;

    beforeEach(async () => {
        vi.restoreAllMocks();
        app = express();
        app.use(express.json());
        // Mock isAuthenticated for all requests
        app.use((req: any, res, next) => {
            req.isAuthenticated = () => true;
            req.user = { id: "user-1" };
            next();
        });
        server = createServer(app);
        await registerRoutes(server, app);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("POST /api/quick-search", () => {
        it("should return 400 if required fields missing", async () => {
            const res = await request(app).post("/api/quick-search").send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });

        it("should return 400 if radius is invalid", async () => {
            const res = await request(app).post("/api/quick-search").send({
                address: "Test St",
                type: "restaurant",
                radius: 9999
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid radius");
        });

        it("should return 400 if address not found", async () => {
            (hasGoogleApiKey as any).mockReturnValue(true);
            (searchPlacesByAddress as any).mockResolvedValue([]);

            const res = await request(app).post("/api/quick-search").send({
                address: "Unknown St",
                type: "restaurant",
                radius: 1000
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Address not found");
        });
    });

    describe("POST /api/businesses", () => {
        it("should return 400 if validation fails", async () => {
            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                // Missing type
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should return 400 if coordinates invalid", async () => {
            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                type: "restaurant",
                address: "Test St",
                latitude: "invalid",
                longitude: 10
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should return 400 if coordinates out of range", async () => {
            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                type: "restaurant",
                address: "Test St",
                latitude: 100, // Invalid lat
                longitude: 10
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });
    });

    describe("PUT /api/businesses/:id", () => {
        it("should return 404 if business not found", async () => {
            vi.spyOn(storage, 'updateBusiness').mockRejectedValue(new Error("Business not found"));

            const res = await request(app).put("/api/businesses/999").send({
                name: "Updated Name"
            });
            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Business not found");
        });

        it("should return 400 if invalid latitude provided", async () => {
            const res = await request(app).put("/api/businesses/1").send({
                latitude: 100
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });
    });

    describe("DELETE /api/businesses/:id", () => {
        it("should return 404 if business not found", async () => {
            vi.spyOn(storage, 'deleteBusiness').mockResolvedValue(false);

            const res = await request(app).delete("/api/businesses/999");
            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Business not found");
        });
    });

    describe("POST /api/run-report/:id", () => {
        it("should return 404 if business not found", async () => {
            vi.spyOn(storage, 'getBusiness').mockResolvedValue(null);

            const res = await request(app).post("/api/run-report/999");
            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Business not found");
        });
    });

    describe("GET /api/reports/:id", () => {
        it("should return 404 if report not found", async () => {
            vi.spyOn(storage, 'getReport').mockResolvedValue(null);

            const res = await request(app).get("/api/reports/999");
            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Report not found");
        });
    });

    describe("GET /api/places/search", () => {
        it("should return 400 if query missing", async () => {
            const res = await request(app).get("/api/places/search");
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Search query is required");
        });

        it("should return message if API key missing", async () => {
            (hasGoogleApiKey as any).mockReturnValue(false);

            const res = await request(app).get("/api/places/search?q=test");
            expect(res.body.apiKeyMissing).toBe(true);
        });
    });

    describe("POST /api/analyze-address", () => {
        it("should return 400 if required fields missing", async () => {
            const res = await request(app).post("/api/analyze-address").send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });

        it("should return 400 if address not found", async () => {
            (hasGoogleApiKey as any).mockReturnValue(true);
            (searchPlacesByAddress as any).mockResolvedValue([]);

            const res = await request(app).post("/api/analyze-address").send({
                address: "Unknown St",
                type: "restaurant",
                radius: 1000
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Address not found");
        });
    });
});

describe("Report Email Export", () => {
    let app: express.Express;
    let server: any;

    beforeEach(async () => {
        vi.restoreAllMocks();
        app = express();
        app.use(express.json());
        // Mock isAuthenticated for all requests
        app.use((req: any, res, next) => {
            req.isAuthenticated = () => true;
            // Default user
            req.user = { id: "user-1" };
            // Override if authMocks is set
            if (authMocks.user) {
                req.user = authMocks.user;
            }
            next();
        });
        server = createServer(app);
        await registerRoutes(server, app);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should send email successfully", async () => {
        // Mock report finding
        vi.spyOn(storage, "getReport").mockResolvedValue({
            id: "rep-1",
            userId: "test-user-id",
            businessName: "Test Bus"
        } as any);

        // Set authenticated user via authMocks which our middleware above uses
        authMocks.user = { id: "test-user-id", email: "user@example.com" };

        (emailService.sendAdHocReport as any).mockResolvedValue(true);

        const res = await request(app)
            .post("/api/reports/rep-1/email")
            .send({
                email: "test@example.com",
                language: "en"
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Email sent successfully");
        expect(emailService.sendAdHocReport).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({ id: "rep-1" }),
            "en"
        );
    });

    it("should return 403 if user does not own report", async () => {
        // Mock report belonging to someone else
        vi.spyOn(storage, "getReport").mockResolvedValue({
            id: "rep-2",
            userId: "other-user-id",
        } as any);

        authMocks.user = { id: "test-user-id" };

        const res = await request(app)
            .post("/api/reports/rep-2/email")
            .send({ email: "test@example.com" });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Unauthorized access to this report");
    });

    it("should return 400 if email is missing", async () => {
        authMocks.user = { id: "test-user-id" };
        const res = await request(app)
            .post("/api/reports/rep-1/email")
            .send({ language: "en" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Email is required");
    });
});

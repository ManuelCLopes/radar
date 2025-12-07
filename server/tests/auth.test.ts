// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import { setupAuth } from "../auth";
import bcrypt from "bcrypt";
import { vi, beforeEach, afterEach } from "vitest";

describe("Authentication API", () => {
    let app: express.Express;
    let server: any;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // Mock session middleware for testing
        const session = require("express-session");
        app.use(session({
            secret: "test-secret",
            resave: false,
            saveUninitialized: false,
        }));

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    afterAll(() => {
        // Cleanup if necessary
    });

    describe("POST /api/register", () => {
        it("should register a new user", async () => {
            const res = await request(app)
                .post("/api/register")
                .send({
                    email: "test_register@example.com",
                    password: "password123",
                    firstName: "Test",
                    lastName: "User",
                    plan: "essential"
                });

            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe("test_register@example.com");
        });

        it("should fail with duplicate email", async () => {
            const res = await request(app)
                .post("/api/register")
                .send({
                    email: "test_register@example.com", // Same email as above
                    password: "password123"
                });

            expect(res.status).toBe(400);
        });
    });

    describe("POST /api/login", () => {
        it("should login with valid credentials", async () => {
            // First register
            await request(app)
                .post("/api/register")
                .send({
                    email: "test_login@example.com",
                    password: "password123"
                });

            // Then login
            const res = await request(app)
                .post("/api/login")
                .send({
                    email: "test_login@example.com",
                    password: "password123"
                });

            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
        });

        it("should fail with invalid credentials", async () => {
            const res = await request(app)
                .post("/api/login")
                .send({
                    email: "test_login@example.com",
                    password: "wrongpassword"
                });

            expect(res.status).toBe(401);
        });
    });
});

describe("Auth Coverage (Edge Cases)", () => {
    let app: express.Express;

    beforeEach(() => {
        vi.restoreAllMocks();
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        setupAuth(app);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("POST /api/register", () => {
        it("should return 400 if email or password missing", async () => {
            const res = await request(app)
                .post("/api/register")
                .send({ firstName: "Test" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Email and password are required");
        });

        it("should return 400 if email already registered", async () => {
            vi.spyOn(storage, 'getUserByEmail').mockResolvedValue({ id: "1", email: "test@example.com" } as any);

            const res = await request(app)
                .post("/api/register")
                .send({ email: "test@example.com", password: "password" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Email already registered");
        });

        it("should handle registration error", async () => {
            vi.spyOn(storage, 'getUserByEmail').mockRejectedValue(new Error("Storage error"));

            const res = await request(app)
                .post("/api/register")
                .send({ email: "test@example.com", password: "password" });

            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Registration failed");
        });
    });

    describe("POST /api/login", () => {
        it("should return 401 if user not found", async () => {
            vi.spyOn(storage, 'getUserByEmail').mockResolvedValue(null);

            const res = await request(app)
                .post("/api/login")
                .send({ email: "nonexistent@example.com", password: "password" });

            expect(res.status).toBe(401);
            expect(res.body.code).toBe("INVALID_CREDENTIALS");
        });

        it("should return 401 if user has no password hash (Google login)", async () => {
            vi.spyOn(storage, 'getUserByEmail').mockResolvedValue({
                id: "1",
                email: "google@example.com",
                passwordHash: null
            } as any);

            const res = await request(app)
                .post("/api/login")
                .send({ email: "google@example.com", password: "password" });

            expect(res.status).toBe(401);
            expect(res.body.code).toBe("GOOGLE_LOGIN_REQUIRED");
        });

        it("should return 401 if password invalid", async () => {
            vi.spyOn(storage, 'getUserByEmail').mockResolvedValue({
                id: "1",
                email: "test@example.com",
                passwordHash: "hashed_password"
            } as any);
            vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

            const res = await request(app)
                .post("/api/login")
                .send({ email: "test@example.com", password: "wrong_password" });

            expect(res.status).toBe(401);
            expect(res.body.code).toBe("INVALID_CREDENTIALS");
        });
    });

    describe("Google OAuth Routes", () => {
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = { ...originalEnv };
            delete process.env.GOOGLE_CLIENT_ID;
            delete process.env.GOOGLE_CLIENT_SECRET;
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it("should return 400 if Google OAuth not configured", async () => {
            const res = await request(app).get("/api/auth/google");
            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Google OAuth is not configured");
        });

        it("should redirect to login if Google OAuth not configured on callback", async () => {
            const res = await request(app).get("/api/auth/google/callback");
            expect(res.status).toBe(302);
            expect(res.header.location).toContain("/login?error=google_not_configured");
        });
    });
});

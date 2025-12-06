// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";

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

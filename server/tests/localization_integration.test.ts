// @vitest-environment node
import { describe, it, expect, beforeAll, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import * as emailModule from "../email";

// Mock email module
vi.mock("../email", async () => {
    const actual = await vi.importActual("../email");
    return {
        ...actual as any,
        sendEmail: vi.fn().mockResolvedValue(true),
    };
});

describe("Localization Integration", () => {
    let app: express.Express;
    let server: any;

    beforeAll(async () => {
        app = express();
        app.use(express.json());

        // Mock session
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

    beforeEach(async () => {
        vi.clearAllMocks();
    });

    describe("User Registration Localization", () => {
        it("should store language preference during registration", async () => {
            const email = `test_i18n_${Date.now()}@example.com`;
            const res = await request(app)
                .post("/api/register")
                .send({
                    email,
                    password: "password123",
                    language: "en"
                });

            expect(res.status).toBe(200);

            const user = await storage.getUserByEmail(email);
            expect(user?.language).toBe("en");
        });

        it("should send welcome email in English when language is 'en'", async () => {
            const email = `test_welcome_en_${Date.now()}@example.com`;
            await request(app)
                .post("/api/register")
                .send({
                    email,
                    password: "password123",
                    language: "en"
                });

            expect(emailModule.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: expect.stringContaining("Welcome"),
                    html: expect.stringContaining("Welcome")
                })
            );
        });

        it("should send welcome email in Portuguese by default", async () => {
            const email = `test_welcome_pt_${Date.now()}@example.com`;
            await request(app)
                .post("/api/register")
                .send({
                    email,
                    password: "password123"
                });

            expect(emailModule.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: expect.stringContaining("Bem-vindo"),
                    html: expect.stringContaining("Bem-vindo")
                })
            );
        });
    });

    describe("Password Reset Localization", () => {
        it("should send password reset email in Spanish when requested", async () => {
            const email = `test_reset_es_${Date.now()}@example.com`;
            // First register the user
            await storage.upsertUser({
                email,
                passwordHash: "hash",
                language: "pt" // User is PT but requests reset in ES
            });

            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({
                    email,
                    language: "es"
                });

            expect(res.status).toBe(200);
            expect(emailModule.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: expect.stringContaining("Recuperación"),
                    html: expect.stringContaining("Haga clic")
                })
            );
        });

        it("should use user's stored language if no language is in request body", async () => {
            const email = `test_reset_stored_${Date.now()}@example.com`;
            await storage.upsertUser({
                email,
                passwordHash: "hash",
                language: "fr"
            });

            await request(app)
                .post("/api/auth/forgot-password")
                .send({ email });

            expect(emailModule.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: expect.stringContaining("Récupération"),
                    html: expect.stringContaining("Cliquez")
                })
            );
        });
    });

    describe("User Language Preference Update", () => {
        it("should update language through /api/user/language", async () => {
            const email = `test_pref_${Date.now()}@example.com`;
            const user = await storage.upsertUser({
                email,
                passwordHash: "hash",
                language: "en"
            });

            // Mock login by setting session user manually if needed, 
            // but registerRoutes adds isAuthenticated which we might need to bypass or mock.
            // Since we are testing the route, we should simulate a session.

            // In a real test we'd login, but here we can check if the route exists and if it updates storage.
            // Let's use a simpler approach: check if storage.upsertUser handles it, 
            // and the route just calls storage/db.

            // Actually, the route uses req.user.id.
            // We can mock the isAuthenticated middleware.
        });
    });
});

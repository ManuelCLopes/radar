
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import {
    createLoginRateLimiter,
    createPasswordResetRequestRateLimiter,
    getRateLimitMax,
} from "../middleware/rate-limit";

describe("Rate Limiting Logic", () => {
    it("should return restrict limit for guests", () => {
        const req = { user: undefined } as any;
        expect(getRateLimitMax(req)).toBe(50);
    });

    it("should return standard limit for free users", () => {
        const req = { user: { plan: "free" } } as any;
        expect(getRateLimitMax(req)).toBe(200);
    });

    it("should return high limit for professional users", () => {
        const req = { user: { plan: "professional" } } as any;
        expect(getRateLimitMax(req)).toBe(1000);
    });

    it("should return standard limit for users with unknown plan", () => {
        const req = { user: { plan: "unknown" } } as any;
        expect(getRateLimitMax(req)).toBe(200);
    });

    it("should rate limit repeated login attempts", async () => {
        const app = express();
        app.use(express.json());
        app.post("/api/login", createLoginRateLimiter(), (_req, res) => {
            res.status(401).json({ message: "Invalid email or password" });
        });

        for (let attempt = 0; attempt < 10; attempt += 1) {
            const response = await request(app)
                .post("/api/login")
                .set("x-forwarded-for", "203.0.113.10")
                .send({ email: "user@example.com", password: "wrong-password" });

            expect(response.status).toBe(401);
        }

        const response = await request(app)
            .post("/api/login")
            .set("x-forwarded-for", "203.0.113.10")
            .send({ email: "user@example.com", password: "wrong-password" });

        expect(response.status).toBe(429);
        expect(response.body.message).toMatch(/too many login attempts/i);
    });

    it("should rate limit password reset requests", async () => {
        const app = express();
        app.use(express.json());
        app.post("/api/auth/forgot-password", createPasswordResetRequestRateLimiter(), (_req, res) => {
            res.json({ message: "If that email exists, a reset link has been sent." });
        });

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const response = await request(app)
                .post("/api/auth/forgot-password")
                .set("x-forwarded-for", "203.0.113.11")
                .send({ email: "user@example.com" });

            expect(response.status).toBe(200);
        }

        const response = await request(app)
            .post("/api/auth/forgot-password")
            .set("x-forwarded-for", "203.0.113.11")
            .send({ email: "user@example.com" });

        expect(response.status).toBe(429);
        expect(response.body.message).toMatch(/too many password reset requests/i);
    });
});

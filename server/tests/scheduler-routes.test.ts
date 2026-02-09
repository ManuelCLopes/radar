// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { createServer } from "http";
import { registerSchedulerRoutes } from "../routes/scheduler";

// Mock scheduler module
vi.mock("../scheduler", () => ({
    getSchedulerStatus: vi.fn(() => ({
        running: true,
        schedule: "0 6 * * 1",
        lastRun: new Date().toISOString()
    })),
    runScheduledReports: vi.fn(async () => ({
        success: 2,
        failed: 0,
        results: []
    }))
}));

// Mock auth middleware
vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        if (req.headers.authorization === "Bearer valid-token") {
            req.user = { id: "1", email: "test@example.com" };
            return next();
        }
        return res.status(401).json({ message: "Unauthorized" });
    }
}));

describe("Scheduler Routes", () => {
    let app: express.Express;
    const originalEnv = process.env;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        registerSchedulerRoutes(app);
    });

    beforeEach(() => {
        process.env = { ...originalEnv };
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe("GET /api/scheduler/status", () => {
        it("should return scheduler status when authenticated", async () => {
            const res = await request(app)
                .get("/api/scheduler/status")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(200);
            expect(res.body.running).toBe(true);
            expect(res.body.schedule).toBe("0 6 * * 1");
        });

        it("should return 401 when not authenticated", async () => {
            const res = await request(app).get("/api/scheduler/status");

            expect(res.status).toBe(401);
        });
    });

    describe("POST /api/scheduler/run-all", () => {
        it("should run all scheduled reports when authenticated", async () => {
            const res = await request(app)
                .post("/api/scheduler/run-all")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(2);
            expect(res.body.failed).toBe(0);
        });

        it("should return 401 when not authenticated", async () => {
            const res = await request(app).post("/api/scheduler/run-all");

            expect(res.status).toBe(401);
        });
    });

    describe("POST /api/cron/trigger-reports", () => {
        it("should return 401 if no cron secret header", async () => {
            process.env.CRON_SECRET = "valid-secret";

            const res = await request(app).post("/api/cron/trigger-reports");

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should return 401 if cron secret header is wrong", async () => {
            process.env.CRON_SECRET = "valid-secret";

            const res = await request(app)
                .post("/api/cron/trigger-reports")
                .set("x-cron-secret", "wrong-secret");

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should return 401 if CRON_SECRET env not set", async () => {
            delete process.env.CRON_SECRET;

            const res = await request(app)
                .post("/api/cron/trigger-reports")
                .set("x-cron-secret", "any-secret");

            expect(res.status).toBe(401);
        });

        it("should trigger reports with valid cron secret", async () => {
            process.env.CRON_SECRET = "valid-secret";

            const res = await request(app)
                .post("/api/cron/trigger-reports")
                .set("x-cron-secret", "valid-secret");

            expect(res.status).toBe(202);
            expect(res.body.message).toContain("triggered successfully");
        });
    });
});

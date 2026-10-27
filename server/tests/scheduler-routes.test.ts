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


vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn(async (businessId: string) => ({
        id: `report-${businessId}`,
        businessName: "Cafe",
        generatedAt: new Date("2026-10-26T06:00:00Z"),
    })),
}));

// Mock storage
vi.mock("../storage", () => ({
    storage: {
        deleteOldUnverifiedUsers: vi.fn().mockResolvedValue(5)
    }
}));

describe("Scheduler Routes", () => {
    let app: express.Express;
    const originalEnv = process.env;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        // Stand-in for passport: tokens map to a regular user or an admin.
        app.use((req: any, _res, next) => {
            const users: Record<string, any> = {
                "Bearer valid-token": { id: "1", email: "test@example.com", role: "user" },
                "Bearer admin-token": { id: "2", email: "admin@example.com", role: "admin" },
            };
            req.user = users[req.headers.authorization as string];
            req.isAuthenticated = () => !!req.user;
            next();
        });
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
        it("should return scheduler status for admins", async () => {
            const res = await request(app)
                .get("/api/scheduler/status")
                .set("Authorization", "Bearer admin-token");

            expect(res.status).toBe(200);
            expect(res.body.running).toBe(true);
            expect(res.body.schedule).toBe("0 6 * * 1");
        });

        it("should forbid regular users and anonymous requests", async () => {
            expect((await request(app).get("/api/scheduler/status").set("Authorization", "Bearer valid-token")).status).toBe(403);
            expect((await request(app).get("/api/scheduler/status")).status).toBe(403);
        });
    });

    describe("POST /api/scheduler/run-all", () => {
        it("should run all scheduled reports for admins", async () => {
            const res = await request(app)
                .post("/api/scheduler/run-all")
                .set("Authorization", "Bearer admin-token");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(2);
            expect(res.body.failed).toBe(0);
        });

        it("should not let regular users trigger reports for everyone", async () => {
            const { runScheduledReports } = await import("../scheduler");
            const res = await request(app)
                .post("/api/scheduler/run-all")
                .set("Authorization", "Bearer valid-token");

            expect(res.status).toBe(403);
            expect(runScheduledReports).not.toHaveBeenCalled();
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

        it("should accept GET requests, which is how Vercel Cron calls it", async () => {
            process.env.CRON_SECRET = "valid-secret";

            const res = await request(app)
                .get("/api/cron/trigger-reports")
                .set("Authorization", "Bearer valid-secret");

            expect(res.status).toBe(202);
        });

        it("should reject GET requests without the secret", async () => {
            process.env.CRON_SECRET = "valid-secret";

            const res = await request(app).get("/api/cron/trigger-reports");

            expect(res.status).toBe(401);
        });

        it("should accept Vercel bearer auth header", async () => {
            process.env.CRON_SECRET = "valid-secret";

            const res = await request(app)
                .post("/api/cron/trigger-reports")
                .set("Authorization", "Bearer valid-secret");

            expect(res.status).toBe(202);
            expect(res.body.message).toContain("triggered successfully");
        });
    });

    describe("POST /api/cron/cleanup-users", () => {
        it("should return 401 if no cron secret header", async () => {
            process.env.CRON_SECRET = "valid-secret";
            const res = await request(app).post("/api/cron/cleanup-users");
            expect(res.status).toBe(401);
        });

        it("should return 401 if cron secret header is wrong", async () => {
            process.env.CRON_SECRET = "valid-secret";
            const res = await request(app)
                .post("/api/cron/cleanup-users")
                .set("x-cron-secret", "wrong-secret");
            expect(res.status).toBe(401);
        });

        it("should trigger cleanup with valid cron secret", async () => {
            process.env.CRON_SECRET = "valid-secret";
            const res = await request(app)
                .post("/api/cron/cleanup-users")
                .set("x-cron-secret", "valid-secret");

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("Cleanup completed");
            expect(res.body.deletedCount).toBe(5);
        });

        it("should accept Vercel bearer auth header", async () => {
            process.env.CRON_SECRET = "valid-secret";
            const res = await request(app)
                .post("/api/cron/cleanup-users")
                .set("Authorization", "Bearer valid-secret");

            expect(res.status).toBe(200);
            expect(res.body.message).toContain("Cleanup completed");
            expect(res.body.deletedCount).toBe(5);
        });

        it("should accept GET requests from Vercel Cron", async () => {
            process.env.CRON_SECRET = "valid-secret";
            const res = await request(app)
                .get("/api/cron/cleanup-users")
                .set("Authorization", "Bearer valid-secret");

            expect(res.status).toBe(200);
            expect(res.body.deletedCount).toBe(5);
        });
    });

    describe("POST /api/cron/business-report", () => {
        beforeEach(() => {
            process.env.CRON_SECRET = "valid-secret";
        });

        it("requires the cron secret", async () => {
            const res = await request(app).post("/api/cron/business-report").send({ businessId: "b1", userId: "u1" });
            expect(res.status).toBe(401);
        });

        it("validates the payload", async () => {
            const res = await request(app)
                .post("/api/cron/business-report")
                .set("Authorization", "Bearer valid-secret")
                .send({ businessId: "b1" });
            expect(res.status).toBe(400);
        });

        it("generates the report as the business owner", async () => {
            const { runReportForBusiness } = await import("../reports");
            const res = await request(app)
                .post("/api/cron/business-report")
                .set("Authorization", "Bearer valid-secret")
                .send({ businessId: "b1", userId: "u1", language: "en" });

            expect(res.status).toBe(200);
            expect(res.body.report.id).toBe("report-b1");
            expect(runReportForBusiness).toHaveBeenCalledWith("b1", "en", undefined, "u1");
        });

        it("reports generation failures", async () => {
            const { runReportForBusiness } = await import("../reports");
            (runReportForBusiness as any).mockRejectedValueOnce(new Error("OpenAI down"));

            const res = await request(app)
                .post("/api/cron/business-report")
                .set("Authorization", "Bearer valid-secret")
                .send({ businessId: "b1", userId: "u1" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("OpenAI down");
        });
    });

    describe("Vercel fan-out", () => {
        it("runs each report through the business-report endpoint", async () => {
            process.env.CRON_SECRET = "valid-secret";
            process.env.VERCEL = "1";
            process.env.PUBLIC_APP_URL = "https://competitorwatcher.pt";
            const { runScheduledReports } = await import("../scheduler");

            const res = await request(app).get("/api/cron/trigger-reports").set("Authorization", "Bearer valid-secret");
            expect(res.status).toBe(200);

            const { runReport } = (runScheduledReports as any).mock.calls[0][0];
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ report: { id: "r1", generatedAt: "2026-10-26T06:00:00.000Z" } }),
            });
            vi.stubGlobal("fetch", fetchMock);
            try {
                const report = await runReport({ id: "b1" }, "pt", "u1");

                expect(fetchMock).toHaveBeenCalledWith("https://competitorwatcher.pt/api/cron/business-report", expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({ Authorization: "Bearer valid-secret" }),
                    body: JSON.stringify({ businessId: "b1", language: "pt", userId: "u1" }),
                }));
                expect(report.generatedAt).toBeInstanceOf(Date);

                fetchMock.mockResolvedValueOnce({ ok: false, status: 504, json: async () => ({}) });
                await expect(runReport({ id: "b2" }, "pt", "u1")).rejects.toThrow("status 504");
            } finally {
                vi.unstubAllGlobals();
            }
        });
    });
});

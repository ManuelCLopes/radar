// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { runScheduledReports } from "../scheduler";

// Mock dependencies
vi.mock("../auth", () => ({
    setupAuth: vi.fn(),
    isAuthenticated: (req: any, res: any, next: any) => {
        req.user = { id: 1, email: "test@example.com" };
        next();
    },
}));

vi.mock("../scheduler", () => ({
    startScheduler: vi.fn(),
    getSchedulerStatus: vi.fn(),
    runScheduledReports: vi.fn(),
}));

vi.mock("../storage", () => ({
    storage: {
        listBusinesses: vi.fn(),
        addBusiness: vi.fn(),
        getBusiness: vi.fn(),
        deleteBusiness: vi.fn(),
        updateBusiness: vi.fn(),
        createReport: vi.fn(),
        getReportsByBusinessId: vi.fn(),
        getReportsByUserId: vi.fn(),
        getReport: vi.fn(),
        findUserByEmail: vi.fn(),
        createPasswordResetToken: vi.fn(),
        getPasswordResetToken: vi.fn(),
        updateUserPassword: vi.fn(),
        markTokenAsUsed: vi.fn(),
        deleteUser: vi.fn(),
        getUser: vi.fn(),
    },
}));

// Mock reports to avoid OpenAI import side effects
vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn(),
}));

describe("Cron Trigger Endpoint", () => {
    let app: express.Express;
    let server: any;
    const originalEnv = process.env;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        server = createServer(app);
        await registerRoutes(server, app);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should return 401 if no secret is provided", async () => {
        process.env.CRON_SECRET = "test-secret";
        const res = await request(app).post("/api/cron/trigger-reports");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 401 if incorrect secret is provided", async () => {
        process.env.CRON_SECRET = "test-secret";
        const res = await request(app)
            .post("/api/cron/trigger-reports")
            .set("x-cron-secret", "wrong-secret");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 401 if CRON_SECRET is not set in env", async () => {
        delete process.env.CRON_SECRET;
        const res = await request(app)
            .post("/api/cron/trigger-reports")
            .set("x-cron-secret", "any-secret");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Unauthorized");
    });

    it("should trigger reports if correct secret is provided", async () => {
        process.env.CRON_SECRET = "test-secret";
        (runScheduledReports as any).mockResolvedValue({
            success: 1,
            failed: 0,
            results: [{ businessId: "1", success: true }],
        });

        const res = await request(app)
            .post("/api/cron/trigger-reports")
            .set("x-cron-secret", "test-secret");

        expect(res.status).toBe(202);
        expect(runScheduledReports).toHaveBeenCalled();
        expect(res.body.message).toContain("processing in background");
        expect(res.body.results).toBeUndefined();
    });
});

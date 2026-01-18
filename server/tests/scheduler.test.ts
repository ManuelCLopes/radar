// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startScheduler, stopScheduler, runScheduledReports, getSchedulerStatus } from "../scheduler";
import { storage } from "../storage";
import * as reports from "../reports";
import { emailService } from "../email";
import * as cron from "node-cron";

// Mock dependencies
vi.mock("node-cron", () => ({
    schedule: vi.fn(() => ({
        stop: vi.fn()
    }))
}));

vi.mock("../storage", () => ({
    storage: {
        listBusinesses: vi.fn(),
        getReportsByBusinessId: vi.fn(),
        getUser: vi.fn()
    }
}));

vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn()
}));

vi.mock("../email", () => ({
    emailService: {
        sendWeeklyReport: vi.fn()
    }
}));

describe("Scheduler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        stopScheduler(); // Ensure clean state
    });

    afterEach(() => {
        stopScheduler();
    });

    describe("startScheduler", () => {
        it("should schedule a task", () => {
            startScheduler();
            expect(cron.schedule).toHaveBeenCalledWith("0 6 * * 1", expect.any(Function));
        });

        it("should not schedule duplicate tasks", () => {
            startScheduler();
            startScheduler();
            startScheduler();
            startScheduler();
            // Should be 2 tasks (weekly report + daily cleanup), called once per startScheduler = 2 calls total if it wasn't safeguarded
            // blocked by check, so still 2 calls from the first startScheduler
            expect(cron.schedule).toHaveBeenCalledTimes(2);
        });
    });

    describe("stopScheduler", () => {
        it("should stop the scheduled task", () => {
            startScheduler();
            stopScheduler();
            // We can't easily access the mock return value here to check if stop() was called
            // without storing the mock return, but we can check status
            expect(getSchedulerStatus().running).toBe(false);
        });
    });

    describe("getSchedulerStatus", () => {
        it("should return correct status when running", () => {
            startScheduler();
            const status = getSchedulerStatus();
            expect(status.running).toBe(true);
            expect(status.schedule).toBe("0 6 * * 1");
        });

        it("should return correct status when stopped", () => {
            stopScheduler();
            const status = getSchedulerStatus();
            expect(status.running).toBe(false);
        });
    });

    describe("runScheduledReports", () => {
        it("should process businesses correctly", async () => {
            const mockBusinesses = [
                { id: "1", name: "Valid Business", locationStatus: "validated", latitude: 10, longitude: 10 },
                { id: "2", name: "Pending Business", locationStatus: "pending" },
                { id: "3", name: "Invalid Loc Business", locationStatus: "validated", latitude: null }
            ];

            (storage.listBusinesses as any).mockResolvedValue(mockBusinesses);
            (storage.getReportsByBusinessId as any).mockResolvedValue([]); // No previous reports

            // Mock user retrieval for business 1
            (storage.getUser as any).mockResolvedValue({ id: "user1", email: "test@example.com", language: "pt" });

            // Create a fake business object property that mockResolvedValue accesses if needed
            // But here we need to make sure the loop finds the user.
            // By default storage.getUser is called with userId.

            // We need to inject userId into mockBusinesses matching the logic
            mockBusinesses[0] = { ...mockBusinesses[0], userId: "user1" } as any;

            (reports.runReportForBusiness as any).mockResolvedValue({ businessName: "Valid Business" });

            const result = await runScheduledReports();

            expect(storage.listBusinesses).toHaveBeenCalled();
            expect(reports.runReportForBusiness).toHaveBeenCalledTimes(1);

            // Verify sendWeeklyReport is called with an array
            expect(emailService.sendWeeklyReport).toHaveBeenCalledTimes(1);
            const callArgs = (emailService.sendWeeklyReport as any).mock.calls[0];
            expect(callArgs[0]).toMatchObject({ id: "user1" }); // user
            expect(Array.isArray(callArgs[1])).toBe(true); // reports array
            expect(callArgs[1]).toHaveLength(1);
            expect(callArgs[1][0].businessName).toBe("Valid Business");

            expect(result.success).toBe(1);
            // Failed count includes pending (1) and orphan (1) = 2
            expect(result.failed).toBe(2);
            expect(result.results).toHaveLength(3);
        });

        it("should handle report generation errors", async () => {
            const mockBusinesses = [
                { id: "1", name: "Error Business", locationStatus: "validated", latitude: 10, longitude: 10, userId: "user1" },
            ];

            (storage.listBusinesses as any).mockResolvedValue(mockBusinesses);
            (storage.getUser as any).mockResolvedValue({ id: "user1", email: "test@example.com" });
            (reports.runReportForBusiness as any).mockRejectedValue(new Error("Analysis failed"));

            const result = await runScheduledReports();

            expect(result.success).toBe(0);
            expect(result.failed).toBe(1);
            expect(result.results[0].error).toBe("Analysis failed");
        });
    });
});

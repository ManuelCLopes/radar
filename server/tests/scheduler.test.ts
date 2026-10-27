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
            // The owner is passed so plan limits apply and the report appears in their history.
            expect(reports.runReportForBusiness).toHaveBeenCalledWith("1", "pt", undefined, "user1");

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

    describe("runScheduledReports with a custom runner", () => {
        const validBusiness = (id: string, userId: string) =>
            ({ id, name: `Business ${id}`, locationStatus: "validated", latitude: 1, longitude: 1, userId });

        beforeEach(() => {
            (storage.getUser as any).mockImplementation(async (id: string) => ({ id, email: `${id}@example.com`, language: "en" }));
        });

        it("never runs more reports at once than the concurrency limit", async () => {
            (storage.listBusinesses as any).mockResolvedValue(
                Array.from({ length: 7 }, (_, i) => validBusiness(String(i), "user1")),
            );
            let inFlight = 0;
            let peak = 0;
            const runReport = vi.fn(async (business: any) => {
                inFlight++;
                peak = Math.max(peak, inFlight);
                await new Promise((resolve) => setTimeout(resolve, 5));
                inFlight--;
                return { businessName: business.name } as any;
            });

            const result = await runScheduledReports({ runReport, concurrency: 3 });

            expect(runReport).toHaveBeenCalledTimes(7);
            expect(peak).toBe(3);
            expect(result.success).toBe(7);
            expect(reports.runReportForBusiness).not.toHaveBeenCalled();
        });

        it("sends one email per owner with only that owner's successful reports", async () => {
            (storage.listBusinesses as any).mockResolvedValue([
                validBusiness("a", "user1"),
                validBusiness("b", "user2"),
                validBusiness("c", "user1"),
            ]);
            const runReport = vi.fn(async (business: any, language: string, userId: string) => {
                if (business.id === "c") throw new Error("Timed out");
                return { businessName: business.name, userId, language } as any;
            });

            const result = await runScheduledReports({ runReport });

            expect(runReport).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }), "en", "user1");
            expect(result).toMatchObject({ success: 2, failed: 1 });
            expect(result.results.find((r) => r.businessId === "c")).toMatchObject({ success: false, error: "Timed out" });
            expect(emailService.sendWeeklyReport).toHaveBeenCalledTimes(2);
            const sentToUser1 = (emailService.sendWeeklyReport as any).mock.calls.find((call: any[]) => call[0].id === "user1");
            expect(sentToUser1[1].map((r: any) => r.businessName)).toEqual(["Business a"]);
        });

        it("emails an owner as soon as their reports are done, without waiting for other owners", async () => {
            (storage.listBusinesses as any).mockResolvedValue([validBusiness("a", "user1"), validBusiness("b", "user2")]);
            let finishSlowReport!: () => void;
            const slowReport = new Promise<void>((resolve) => { finishSlowReport = resolve; });
            const runReport = vi.fn(async (business: any) => {
                if (business.id === "b") await slowReport;
                return { businessName: business.name } as any;
            });

            const run = runScheduledReports({ runReport, concurrency: 2 });
            await vi.waitFor(() => expect(emailService.sendWeeklyReport).toHaveBeenCalledTimes(1));
            expect((emailService.sendWeeklyReport as any).mock.calls[0][0].id).toBe("user1");

            finishSlowReport();
            await run;
            expect(emailService.sendWeeklyReport).toHaveBeenCalledTimes(2);
        });

        it("skips the email for an owner whose reports all failed", async () => {
            (storage.listBusinesses as any).mockResolvedValue([validBusiness("a", "user1")]);

            await runScheduledReports({ runReport: vi.fn().mockRejectedValue(new Error("boom")) });

            expect(emailService.sendWeeklyReport).not.toHaveBeenCalled();
        });
    });
});

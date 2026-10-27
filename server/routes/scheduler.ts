import type { Express, Request, RequestHandler } from "express";
import { getSchedulerStatus, runScheduledReports, type BusinessReportRunner } from "../scheduler.js";
import { runReportForBusiness } from "../reports.js";
import { getAppBaseUrl } from "../urls.js";
import type { Report } from "../../shared/schema.js";
import { storage } from "../storage.js";

function isValidCronRequest(req: Request): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return false;
    }

    const headerSecret = req.headers["x-cron-secret"];
    if (typeof headerSecret === "string" && headerSecret === cronSecret) {
        return true;
    }

    const authHeader = req.headers.authorization;
    return authHeader === `Bearer ${cronSecret}`;
}

// Running every user's reports costs API credits and emails everyone, so only
// admins may trigger it manually.
const isAdmin: RequestHandler = (req, res, next) => {
    if (!req.isAuthenticated() || (req.user as { role?: string }).role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};

// On Vercel each report runs in its own function invocation (via the
// business-report endpoint below), so the cron run only waits on them in
// parallel instead of generating every report inside one 300s function.
function createHttpReportRunner(baseUrl: string, cronSecret: string): BusinessReportRunner {
    return async (business, language, userId) => {
        const response = await fetch(`${baseUrl}/api/cron/business-report`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
            body: JSON.stringify({ businessId: business.id, language, userId }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.report) {
            throw new Error(body.error || `Report request failed with status ${response.status}`);
        }
        const report = body.report as Report;
        return { ...report, generatedAt: new Date(report.generatedAt) };
    };
}

export function registerSchedulerRoutes(app: Express) {
    app.get("/api/scheduler/status", isAdmin, async (req, res) => {
        try {
            const status = getSchedulerStatus();
            res.json(status);
        } catch (error) {
            console.error("Error getting scheduler status:", error);
            res.status(500).json({ error: "Failed to get scheduler status" });
        }
    });

    app.post("/api/scheduler/run-all", isAdmin, async (req, res) => {
        try {
            const results = await runScheduledReports();
            res.json(results);
        } catch (error) {
            console.error("Error running scheduled reports:", error);
            res.status(500).json({ error: "Failed to run scheduled reports" });
        }
    });

    // External Cron Trigger Endpoint. Vercel Cron calls with GET; POST is kept
    // for external schedulers.
    const triggerReports: RequestHandler = async (req, res) => {
        try {
            if (!isValidCronRequest(req)) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            console.log("[Cron] Triggered report generation via API");

            // In serverless runtimes we should not return before the task finishes,
            // because work scheduled after the response can be dropped.
            const shouldRunInline = process.env.VERCEL === "1";
            if (shouldRunInline) {
                const results = await runScheduledReports({
                    runReport: createHttpReportRunner(getAppBaseUrl(req), process.env.CRON_SECRET!),
                });
                return res.status(200).json({
                    message: "Scheduled reports completed",
                    ...results,
                });
            }

            // Long-running server mode (non-serverless): allow async background execution.
            runScheduledReports().catch(err => {
                console.error("[Cron] Background report generation failed:", err);
            });

            res.status(202).json({
                message: "Scheduled reports triggered successfully (processing in background)"
            });
        } catch (error) {
            console.error("[Cron] Error triggering reports:", error);
            res.status(500).json({ error: "Failed to trigger reports" });
        }
    };
    app.get("/api/cron/trigger-reports", triggerReports);
    app.post("/api/cron/trigger-reports", triggerReports);

    // Generates a single scheduled report; called by the cron run above.
    app.post("/api/cron/business-report", async (req, res) => {
        if (!isValidCronRequest(req)) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { businessId, language, userId } = req.body ?? {};
        if (typeof businessId !== "string" || typeof userId !== "string") {
            return res.status(400).json({ error: "businessId and userId are required" });
        }

        try {
            const report = await runReportForBusiness(
                businessId,
                typeof language === "string" ? language : "pt",
                undefined,
                userId,
            );
            res.json({ report });
        } catch (error) {
            console.error(`[Cron] Failed to generate report for business ${businessId}:`, error);
            res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate report" });
        }
    });

    // Cleanup Unverified Users Endpoint
    const cleanupUsers: RequestHandler = async (req, res) => {
        try {
            if (!isValidCronRequest(req)) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            console.log("[Cron] Triggered unverified user cleanup via API");

            // Delete users created > 7 days ago
            const count = await storage.deleteOldUnverifiedUsers(7);

            console.log(`[Cron] Cleanup completed. Deleted ${count} unverified users.`);

            res.json({
                message: "Cleanup completed successfully",
                deletedCount: count
            });
        } catch (error) {
            console.error("[Cron] Error cleaning up users:", error);
            res.status(500).json({ error: "Failed to cleanup users" });
        }
    };
    app.get("/api/cron/cleanup-users", cleanupUsers);
    app.post("/api/cron/cleanup-users", cleanupUsers);
}

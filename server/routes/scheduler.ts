import type { Express } from "express";
import { getSchedulerStatus, runScheduledReports } from "../scheduler";
import { isAuthenticated } from "../auth";

export function registerSchedulerRoutes(app: Express) {
    app.get("/api/scheduler/status", isAuthenticated, async (req, res) => {
        try {
            const status = getSchedulerStatus();
            res.json(status);
        } catch (error) {
            console.error("Error getting scheduler status:", error);
            res.status(500).json({ error: "Failed to get scheduler status" });
        }
    });

    app.post("/api/scheduler/run-all", isAuthenticated, async (req, res) => {
        try {
            const results = await runScheduledReports();
            res.json(results);
        } catch (error) {
            console.error("Error running scheduled reports:", error);
            res.status(500).json({ error: "Failed to run scheduled reports" });
        }
    });

    // External Cron Trigger Endpoint
    app.post("/api/cron/trigger-reports", async (req, res) => {
        try {
            const authHeader = req.headers["x-cron-secret"];
            const cronSecret = process.env.CRON_SECRET;

            if (!cronSecret || authHeader !== cronSecret) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            console.log("[Cron] Triggered report generation via API");

            // Run in background without awaiting to prevent timeout
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
    });
}

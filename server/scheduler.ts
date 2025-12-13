import * as cron from "node-cron";
import { storage } from "./storage";
import { runReportForBusiness } from "./reports";
import { emailService } from "./email";

let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

export function startScheduler() {
  if (scheduledTask) {
    console.log("[Scheduler] Scheduler already running");
    return;
  }

  scheduledTask = cron.schedule("0 6 * * 1", async () => {
    console.log("[Scheduler] Running weekly competitor analysis...");
    await runScheduledReports();
  });

  console.log("[Scheduler] Weekly report scheduler started (runs every Monday at 6 AM)");
}

export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Scheduler] Scheduler stopped");
  }
}

export async function runScheduledReports(): Promise<{
  success: number;
  failed: number;
  results: { businessId: string; businessName: string; success: boolean; error?: string }[]
}> {
  const businesses = await storage.listBusinesses();
  console.log(`[Scheduler] Found ${businesses.length} businesses to analyze`);

  const results: { businessId: string; businessName: string; success: boolean; error?: string }[] = [];
  let success = 0;
  let failed = 0;

  for (const business of businesses) {
    if (business.locationStatus === "pending" || business.latitude === null || business.longitude === null) {
      console.log(`[Scheduler] Skipping ${business.name} - pending location verification`);
      results.push({
        businessId: business.id,
        businessName: business.name,
        success: false,
        error: "Pending location verification"
      });
      failed++;
      continue;
    }

    try {
      console.log(`[Scheduler] Generating report for: ${business.name}`);
      const report = await runReportForBusiness(business.id);
      console.log("[Scheduler] Generated report:", report);

      // Attempt to find the user associated with this business
      // Since we don't have a direct link in the businesses table, we look for previous reports
      // or searches that might link them.
      // Ideally, we should add userId to businesses table, but for now let's try to find a user
      // who has generated a report for this business before.
      const previousReports = await storage.getReportsByBusinessId(business.id);
      const userId = previousReports.find(r => r.userId)?.userId;

      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          await emailService.sendWeeklyReport(user, report);
          console.log(`[Scheduler] Sent email to ${user.email} for business ${business.name}`);
        }
      } else {
        console.log(`[Scheduler] No user found for business ${business.name}, skipping email.`);
      }

      results.push({
        businessId: business.id,
        businessName: business.name,
        success: true
      });
      success++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Scheduler] Failed to generate report for ${business.name}:`, errorMessage);
      results.push({
        businessId: business.id,
        businessName: business.name,
        success: false,
        error: errorMessage
      });
      failed++;
    }
  }

  console.log(`[Scheduler] Completed: ${success} successful, ${failed} failed`);
  return { success, failed, results };
}

export function getSchedulerStatus(): {
  running: boolean;
  nextRun: string | null;
  schedule: string;
} {
  return {
    running: scheduledTask !== null,
    nextRun: scheduledTask ? "Every Monday at 6:00 AM" : null,
    schedule: "0 6 * * 1"
  };
}

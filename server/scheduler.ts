import * as cron from "node-cron";
import { storage } from "./storage";
import { runReportForBusiness } from "./reports";
import { emailService } from "./email";

let scheduledTask: ReturnType<typeof cron.schedule> | null = null;
let cleanupTask: ReturnType<typeof cron.schedule> | null = null;

export function startScheduler() {
  if (scheduledTask) {
    console.log("[Scheduler] Scheduler already running");
    return;
  }

  scheduledTask = cron.schedule("0 6 * * 1", async () => {
    console.log("[Scheduler] Running weekly competitor analysis...");
    await runScheduledReports();
  });

  // Daily cleanup of unverified users at 4 AM
  // Daily cleanup of unverified users at 4 AM
  cleanupTask = cron.schedule("0 4 * * *", async () => {
    try {
      console.log("[Scheduler] Cleaning up expired unverified users...");
      const count = await storage.deleteExpiredUnverifiedUsers();
      if (count > 0) {
        console.log(`[Scheduler] Deleted ${count} expired unverified users`);
      }
    } catch (error) {
      console.error("[Scheduler] Error deleting unverified users:", error);
    }
  });

  console.log("[Scheduler] Weekly report scheduler started (runs every Monday at 6 AM)");
}

export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
  }
  console.log("[Scheduler] Scheduler stopped");
}


import type { Business, User } from "@shared/schema";
import type { Report } from "@shared/schema";

export async function runScheduledReports(): Promise<{
  success: number;
  failed: number;
  results: { businessId: string; businessName: string; success: boolean; error?: string }[]
}> {
  const businesses = await storage.listBusinesses();
  // console.log(`[Scheduler] Found ${businesses.length} businesses to analyze`);

  const results: { businessId: string; businessName: string; success: boolean; error?: string }[] = [];
  const userBusinessMap = new Map<string, { user: User, businesses: Business[] }>();
  let success = 0;
  let failed = 0;

  // Pass 1: Group businesses by User
  for (const business of businesses) {
    if (business.locationStatus === "pending" || business.latitude === null || business.longitude === null) {
      results.push({
        businessId: business.id,
        businessName: business.name,
        success: false,
        error: "Pending location verification"
      });
      failed++; // Increment failed count
      continue;
    }


    let user: User | undefined;

    if (business.userId) {
      user = await storage.getUser(business.userId);
    } else {
      // Fallback for legacy data: try to find user from previous reports
      const previousReports = await storage.getReportsByBusinessId(business.id);
      const userId = previousReports.find(r => r.userId)?.userId;
      if (userId) {
        user = await storage.getUser(userId);
      }
    }

    if (user) {
      // Strict ownership check
      if (business.userId && business.userId !== user.id) {
        console.warn(`[Scheduler] Security: Skiping business ${business.id} - mismatch owner ${business.userId} vs infereed/found ${user.id}`);
        continue;
      }

      if (!userBusinessMap.has(user.id)) {
        userBusinessMap.set(user.id, { user, businesses: [] });
      }
      userBusinessMap.get(user.id)!.businesses.push(business);
    } else {
      // Identify if this is a "location report" (orphan business) and skip weekly reporting
      // Logic: If no user can be associated, we don't send emails.
      results.push({
        businessId: business.id,
        businessName: business.name,
        success: false,
        error: "No associated user found for weekly report"
      });
      failed++;
    }
  }

  // Pass 2: Generate reports and send emails per user
  for (const [userId, { user, businesses }] of Array.from(userBusinessMap.entries())) {
    const userReports: Report[] = [];
    const language = user.language || "pt";

    // Generate all reports for this user first
    for (const business of businesses) {
      try {
        const report = await runReportForBusiness(business.id, language);
        userReports.push(report);

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

    // Send consolidated email if we have at least one report
    if (userReports.length > 0) {
      try {
        await emailService.sendWeeklyReport(user, userReports);
      } catch (emailError) {
        console.error(`[Scheduler] Failed to send email to ${user.email}:`, emailError);
        // Note: We already marked individual reports as "success" (generated), 
        // but maybe we should log this failure separately? 
        // For now, sticking to the existing pattern where generate = success.
      }
    }
  }

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

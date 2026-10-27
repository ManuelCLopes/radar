import * as cron from "node-cron";
import { storage } from "./storage.js";
import { runReportForBusiness } from "./reports.js";
import { emailService } from "./email.js";

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


import type { Business, User, Report } from "../shared/schema.js";

// Generates one business's report. In-process by default; on Vercel the cron
// route passes a runner that hands each report to its own function invocation
// so the whole run is not bound by a single function's time limit.
export type BusinessReportRunner = (business: Business, language: string, userId: string) => Promise<Report>;

const runReportInProcess: BusinessReportRunner = (business, language, userId) =>
  // Pass the owner so their plan limits apply and the report shows in their history.
  runReportForBusiness(business.id, language, undefined, userId);

export const SCHEDULED_REPORT_CONCURRENCY = 20;

// Runs `task` over `items` with at most `limit` in flight, keeping input order.
async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      output[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

export async function runScheduledReports({
  runReport = runReportInProcess,
  concurrency = SCHEDULED_REPORT_CONCURRENCY,
}: { runReport?: BusinessReportRunner; concurrency?: number } = {}): Promise<{
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

  // Pass 2: Generate every report, a bounded number at a time. Jobs are grouped
  // by owner and each owner's email goes out as soon as their last report is
  // done, so a run cut short by a time limit still delivers to the owners it
  // finished instead of nobody.
  const pending = new Map<string, { user: User; remaining: number; reports: Report[] }>();
  for (const { user, businesses } of Array.from(userBusinessMap.values())) {
    pending.set(user.id, { user, remaining: businesses.length, reports: [] });
  }
  const jobs = Array.from(userBusinessMap.values()).flatMap(({ user, businesses }) =>
    businesses.map((business) => ({ user, business })));

  const outcomes = await mapWithConcurrency(jobs, concurrency, async ({ user, business }) => {
    let outcome: { user: User; business: Business; report?: Report; error?: string };
    try {
      const report = await runReport(business, user.language || "pt", user.id);
      outcome = { user, business, report };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Scheduler] Failed to generate report for ${business.name}:`, errorMessage);
      outcome = { user, business, error: errorMessage };
    }

    const owner = pending.get(user.id)!;
    if (outcome.report) owner.reports.push(outcome.report);
    owner.remaining--;
    if (owner.remaining === 0 && owner.reports.length > 0) {
      try {
        await emailService.sendWeeklyReport(owner.user, owner.reports);
      } catch (emailError) {
        // Reports are already generated and saved; only the email failed.
        console.error(`[Scheduler] Failed to send email to ${owner.user.email}:`, emailError);
      }
    }
    return outcome;
  });

  for (const outcome of outcomes) {
    if (outcome.report) {
      results.push({ businessId: outcome.business.id, businessName: outcome.business.name, success: true });
      success++;
    } else {
      results.push({
        businessId: outcome.business.id,
        businessName: outcome.business.name,
        success: false,
        error: outcome.error,
      });
      failed++;
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

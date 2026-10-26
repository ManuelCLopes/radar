import { describe, it, expect } from "vitest";
import { buildAdminOverview, buildApiUsageSummary, reportStatusFromAnalysis } from "../adminStats";
import { toSafeUser } from "../safeUser";

const now = new Date("2026-10-26T22:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

describe("reportStatusFromAnalysis", () => {
    it("classifies pending, failed and completed reports", () => {
        expect(reportStatusFromAnalysis("Generating...")).toBe("pending");
        expect(reportStatusFromAnalysis("Error: boom")).toBe("failed");
        expect(reportStatusFromAnalysis("{\"summary\":\"ok\"}")).toBe("completed");
    });
});

describe("buildAdminOverview", () => {
    const overview = buildAdminOverview({
        users: [
            { createdAt: daysAgo(0), plan: "pro", role: "admin", isVerified: true },
            { createdAt: daysAgo(3), plan: "free", role: "user", isVerified: false },
            { createdAt: daysAgo(90), plan: "free", role: "user", isVerified: true },
            { createdAt: null, plan: "free", role: "user", isVerified: true },
        ],
        reports: [
            { generatedAt: daysAgo(1), userId: "u1", status: "completed", competitorCount: 10, businessType: "cafe" },
            { generatedAt: daysAgo(10), userId: null, status: "completed", competitorCount: 6, businessType: "cafe" },
            { generatedAt: daysAgo(60), userId: null, status: "completed", competitorCount: 0, businessType: "gym" },
            { generatedAt: daysAgo(0), userId: "u1", status: "pending", competitorCount: 0, businessType: "cafe" },
            { generatedAt: daysAgo(2), userId: "u1", status: "failed", competitorCount: 0, businessType: null },
        ],
        businessCount: 5,
    }, { now, days: 30 });

    it("counts users", () => {
        expect(overview.users).toEqual({ total: 4, pro: 1, verified: 3, admins: 1, newInPeriod: 2 });
        expect(overview.proConversionRate).toBe(25);
    });

    it("counts only completed reports and separates pending/failed", () => {
        expect(overview.reports).toEqual({ total: 3, inPeriod: 2, last7Days: 1, guestPreviews: 2, pending: 1, failed: 1 });
    });

    it("averages competitors over reports that found any", () => {
        expect(overview.avgCompetitors).toBe(8);
    });

    it("ranks business types from completed reports", () => {
        expect(overview.typeDistribution).toEqual([{ type: "cafe", count: 2 }, { type: "gym", count: 1 }]);
    });

    it("builds one bucket per UTC day ending today", () => {
        expect(overview.series).toHaveLength(30);
        expect(overview.series[29]).toEqual({ date: "2026-10-26", users: 1, reports: 0 });
        expect(overview.series[28]).toEqual({ date: "2026-10-25", users: 0, reports: 1 });
        expect(overview.series.reduce((sum, d) => sum + d.reports, 0)).toBe(2);
    });

    it("handles an empty system", () => {
        const empty = buildAdminOverview({ users: [], reports: [], businessCount: 0 }, { now });
        expect(empty.proConversionRate).toBe(0);
        expect(empty.avgCompetitors).toBe(0);
        expect(empty.series.every((d) => d.users === 0 && d.reports === 0)).toBe(true);
    });
});

describe("buildApiUsageSummary", () => {
    it("counts calls per service per day and totals tokens separately", () => {
        const summary = buildApiUsageSummary([
            { createdAt: daysAgo(0), service: "google_places", tokens: null },
            { createdAt: daysAgo(0), service: "google_places", tokens: null },
            { createdAt: daysAgo(0), service: "openai", tokens: 5000 },
            { createdAt: daysAgo(1), service: "openai", tokens: 3000 },
            { createdAt: daysAgo(45), service: "openai", tokens: 9999 },
        ], { now, days: 30 });

        expect(summary.daily).toHaveLength(30);
        expect(summary.daily[29]).toEqual({ date: "2026-10-26", google: 2, openAi: 1 });
        expect(summary.daily[28]).toEqual({ date: "2026-10-25", google: 0, openAi: 1 });
        expect(summary.totals).toEqual({ googleCalls: 2, openAiCalls: 2, openAiTokens: 8000 });
    });
});

describe("toSafeUser", () => {
    it("strips credentials and billing identifiers", () => {
        const safe = toSafeUser({
            id: "1",
            email: "a@b.c",
            passwordHash: "hash",
            verificationToken: "tok",
            verificationTokenExpiresAt: new Date(),
            stripeCustomerId: "cus_1",
            stripeSubscriptionId: "sub_1",
        });
        expect(safe).toEqual({ id: "1", email: "a@b.c" });
    });
});

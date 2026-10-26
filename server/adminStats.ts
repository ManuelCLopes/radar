// Aggregations for the admin overview. Storage backends feed lightweight rows
// (no report HTML/JSON payloads) and all counting happens here, so the numbers
// are computed the same way regardless of backend.

export type AdminReportStatus = "completed" | "pending" | "failed";

export interface AdminUserRow {
    createdAt: Date | null;
    plan: string;
    role: string;
    isVerified: boolean;
}

export interface AdminReportRow {
    generatedAt: Date;
    userId: string | null;
    status: AdminReportStatus;
    competitorCount: number;
    businessType: string | null;
}

export interface AdminOverviewRows {
    users: AdminUserRow[];
    reports: AdminReportRow[];
    businessCount: number;
}

export interface AdminOverview {
    periodDays: number;
    users: { total: number; pro: number; verified: number; admins: number; newInPeriod: number };
    reports: { total: number; inPeriod: number; last7Days: number; guestPreviews: number; pending: number; failed: number };
    businesses: { total: number };
    proConversionRate: number;
    avgCompetitors: number;
    typeDistribution: { type: string; count: number }[];
    series: { date: string; users: number; reports: number }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function reportStatusFromAnalysis(aiAnalysis: string | null | undefined): AdminReportStatus {
    if (aiAnalysis === "Generating...") return "pending";
    if (aiAnalysis?.startsWith("Error:")) return "failed";
    return "completed";
}

const toUtcDate = (date: Date) => date.toISOString().slice(0, 10);

export function buildAdminOverview(
    { users, reports, businessCount }: AdminOverviewRows,
    { now = new Date(), days = 30 }: { now?: Date; days?: number } = {},
): AdminOverview {
    // Series buckets are whole UTC days ending today, so "in period" means the
    // same window the charts show.
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const periodStart = new Date(todayStart - (days - 1) * DAY_MS);
    const weekStart = new Date(todayStart - 6 * DAY_MS);

    const series = new Map<string, { date: string; users: number; reports: number }>();
    for (let i = days - 1; i >= 0; i--) {
        const date = toUtcDate(new Date(todayStart - i * DAY_MS));
        series.set(date, { date, users: 0, reports: 0 });
    }

    let newInPeriod = 0;
    for (const user of users) {
        if (!user.createdAt) continue;
        const bucket = series.get(toUtcDate(user.createdAt));
        if (bucket) bucket.users++;
        if (user.createdAt >= periodStart) newInPeriod++;
    }

    const completed = reports.filter((r) => r.status === "completed");
    let inPeriod = 0;
    let last7Days = 0;
    const typeCounts = new Map<string, number>();
    for (const report of completed) {
        const bucket = series.get(toUtcDate(report.generatedAt));
        if (bucket) bucket.reports++;
        if (report.generatedAt >= periodStart) inPeriod++;
        if (report.generatedAt >= weekStart) last7Days++;
        if (report.businessType) {
            typeCounts.set(report.businessType, (typeCounts.get(report.businessType) || 0) + 1);
        }
    }

    // Reports that found nothing usually mean a failed lookup, not an empty market.
    const withCompetitors = completed.filter((r) => r.competitorCount > 0);
    const avgCompetitors = withCompetitors.length > 0
        ? Math.round(withCompetitors.reduce((sum, r) => sum + r.competitorCount, 0) / withCompetitors.length)
        : 0;

    const pro = users.filter((u) => u.plan === "pro").length;

    return {
        periodDays: days,
        users: {
            total: users.length,
            pro,
            verified: users.filter((u) => u.isVerified).length,
            admins: users.filter((u) => u.role === "admin").length,
            newInPeriod,
        },
        reports: {
            total: completed.length,
            inPeriod,
            last7Days,
            guestPreviews: completed.filter((r) => !r.userId).length,
            pending: reports.filter((r) => r.status === "pending").length,
            failed: reports.filter((r) => r.status === "failed").length,
        },
        businesses: { total: businessCount },
        proConversionRate: users.length > 0 ? Math.round((pro / users.length) * 1000) / 10 : 0,
        avgCompetitors,
        typeDistribution: Array.from(typeCounts, ([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6),
        series: Array.from(series.values()),
    };
}

export interface ApiUsageRow {
    createdAt: Date;
    service: string;
    tokens: number | null;
}

export interface ApiUsageSummary {
    daily: { date: string; google: number; openAi: number }[];
    totals: { googleCalls: number; openAiCalls: number; openAiTokens: number };
}

// Counts requests per service per day. Google calls and OpenAI tokens are
// different units, so tokens are only reported as a total, never stacked.
export function buildApiUsageSummary(rows: ApiUsageRow[], { now = new Date(), days = 30 } = {}): ApiUsageSummary {
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const daily = new Map<string, { date: string; google: number; openAi: number }>();
    for (let i = days - 1; i >= 0; i--) {
        const date = toUtcDate(new Date(todayStart - i * DAY_MS));
        daily.set(date, { date, google: 0, openAi: 0 });
    }

    const totals = { googleCalls: 0, openAiCalls: 0, openAiTokens: 0 };
    for (const row of rows) {
        const bucket = daily.get(toUtcDate(row.createdAt));
        if (!bucket) continue;
        if (row.service === "google_places") {
            bucket.google++;
            totals.googleCalls++;
        } else if (row.service === "openai") {
            bucket.openAi++;
            totals.openAiCalls++;
            totals.openAiTokens += row.tokens || 0;
        }
    }

    return { daily: Array.from(daily.values()), totals };
}

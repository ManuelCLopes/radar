
export const SUBSCRIPTION_LIMITS = {
    free: {
        maxBusinesses: 1,
        maxMonthlyReports: 2,
        maxRadius: 5000,
        maxCompetitors: 10,
    },
    pro: {
        maxBusinesses: 5,
        maxMonthlyReports: 30,
        maxRadius: 20000,
        maxCompetitors: 100,
    },
    agency: {
        maxBusinesses: 50,
        maxMonthlyReports: 250,
        maxRadius: 50000,
        maxCompetitors: 250,
    },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;

export function getPlanLimits(plan: string | null | undefined) {
    const normalizedPlan = (plan?.toLowerCase() || 'free') as SubscriptionPlan;
    return SUBSCRIPTION_LIMITS[normalizedPlan] || SUBSCRIPTION_LIMITS.free;
}

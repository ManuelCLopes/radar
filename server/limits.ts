
export const SUBSCRIPTION_LIMITS = {
    free: {
        maxBusinesses: 1,
        maxMonthlyReports: 2,
        maxRadius: 5000,
        maxCompetitors: 10,
    },
    pro: {
        maxBusinesses: 3,
        maxMonthlyReports: 10,
        maxRadius: 20000,
        maxCompetitors: 100,
    },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_LIMITS;

export function getPlanLimits(plan: string | null | undefined) {
    const normalizedPlan = (plan?.toLowerCase() || 'free') as SubscriptionPlan;
    return SUBSCRIPTION_LIMITS[normalizedPlan] || SUBSCRIPTION_LIMITS.free;
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePricingModal } from "@/context/PricingModalContext";
import type { Business } from "@shared/schema";

interface TrendData {
    id: string;
    date: string;
    avgRating: number;
    competitorCount: number;
    minRating: number;
    maxRating: number;
}

interface TrendsDashboardProps {
    business: Business;
}

export function TrendsDashboard({ business }: TrendsDashboardProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { openPricing } = usePricingModal();
    const isPro = user?.plan === "pro";

    const { data: trends = [], isLoading, error } = useQuery<TrendData[]>({
        queryKey: ["/api/trends", business.id],
        enabled: isPro,
        retry: false
    });

    if (!isPro) {
        return (
            <div className="relative overflow-hidden rounded-lg border bg-background p-8">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {t("pro.trends.lockedTitle", "Unlock Competitor Trends")}
                    </h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        {t("pro.trends.lockedDesc", "Track your rating performance and market density over time with professional analytics.")}
                    </p>
                    <Button onClick={() => openPricing()}>
                        {t("pro.trends.unlock", "Unlock Pro Metrics")}
                    </Button>
                </div>

                {/* Mock Background UI */}
                <div className="opacity-20 pointer-events-none filter blur-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("trends.ratingHistory", "Rating History")}</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]" />
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("trends.marketActivity", "Market Activity")}</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]" />
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="p-8 text-center">{t("common.loading", "Loading trends...")}</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{t("common.error", "Failed to load trends")}</div>;
    }

    if (trends.length === 0) {
        return (
            <div className="p-8 text-center border rounded-lg bg-muted/10">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t("trends.noData", "No trend data yet")}</h3>
                <p className="text-muted-foreground mt-2">
                    {t("trends.noDataDesc", "Generate more reports over time to see trends appear here.")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            {t("trends.ratingHistory", "Competitor Rating Trends")}
                        </CardTitle>
                        <CardDescription>
                            {t("trends.ratingHistoryDesc", "Average competitor rating over time")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 5]}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip
                                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avgRating"
                                        stroke="hsl(var(--primary))"
                                        fillOpacity={1}
                                        fill="url(#colorRating)"
                                        strokeWidth={2}
                                        name={t("trends.avgRating", "Avg Rating")}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {t("trends.marketActivity", "Market Activity")}
                        </CardTitle>
                        <CardDescription>
                            {t("trends.marketActivityDesc", "Number of competitors found per report")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar
                                        dataKey="competitorCount"
                                        fill="hsl(var(--secondary))"
                                        radius={[4, 4, 0, 0]}
                                        name={t("trends.competitorCount", "Competitors")}
                                        maxBarSize={50}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

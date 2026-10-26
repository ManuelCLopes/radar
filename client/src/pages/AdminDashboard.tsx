import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Building2, Crown, Target, AlertTriangle, RefreshCw } from "lucide-react";
import AdminLayout, { AdminLoading } from "@/components/layouts/AdminLayout";
import { OverviewCharts, type AdminSeriesPoint } from "@/components/admin/OverviewCharts";
import { ApiUsageChart, type ApiUsageSummary } from "@/components/admin/ApiUsageChart";
import { TopConsumersTable, type ConsumerStats } from "@/components/admin/TopConsumersTable";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface AdminOverview {
    periodDays: number;
    users: { total: number; pro: number; verified: number; admins: number; newInPeriod: number };
    reports: { total: number; inPeriod: number; last7Days: number; guestPreviews: number; pending: number; failed: number };
    businesses: { total: number };
    proConversionRate: number;
    avgCompetitors: number;
    typeDistribution: { type: string; count: number }[];
    series: AdminSeriesPoint[];
}

function StatCard({ title, value, detail, icon: Icon, tone }: {
    title: string;
    value: string | number;
    detail?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: "warning";
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-4 w-4", tone === "warning" ? "text-amber-500" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const enabled = user?.role === "admin";

    const overview = useQuery<AdminOverview>({ queryKey: ["/api/admin/overview"], enabled });
    const usage = useQuery<ApiUsageSummary>({ queryKey: ["/api/admin/usage"], enabled });
    const consumers = useQuery<ConsumerStats[]>({ queryKey: ["/api/admin/usage/users"], enabled });

    const refresh = () => {
        overview.refetch();
        usage.refetch();
        consumers.refetch();
    };
    const isFetching = overview.isFetching || usage.isFetching || consumers.isFetching;
    const format = (value: number) => value.toLocaleString(i18n.language);
    const data = overview.data;

    return (
        <AdminLayout
            title={t("admin.dashboard.title")}
            subtitle={t("admin.dashboard.welcomeBack", { name: user?.firstName || "Admin" })}
            actions={
                <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
                    {t("admin.dashboard.refresh")}
                </Button>
            }
        >
            {overview.isLoading ? (
                <AdminLoading />
            ) : overview.isError || !data ? (
                <Card>
                    <CardContent className="py-10 text-center text-destructive">
                        {t("admin.dashboard.loadError")}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title={t("admin.dashboard.cards.totalUsers")}
                            value={format(data.users.total)}
                            detail={t("admin.dashboard.cards.totalUsersDesc", {
                                verified: format(data.users.verified),
                                count: data.users.newInPeriod,
                                days: data.periodDays,
                            })}
                            icon={Users}
                        />
                        <StatCard
                            title={t("admin.dashboard.cards.proUsers")}
                            value={format(data.users.pro)}
                            detail={t("admin.dashboard.cards.proUsersDesc", {
                                rate: data.proConversionRate.toLocaleString(i18n.language),
                            })}
                            icon={Crown}
                        />
                        <StatCard
                            title={t("admin.dashboard.cards.totalReports")}
                            value={format(data.reports.total)}
                            detail={t("admin.dashboard.cards.totalReportsDesc", {
                                week: format(data.reports.last7Days),
                                guests: format(data.reports.guestPreviews),
                            })}
                            icon={FileText}
                        />
                        <StatCard
                            title={t("admin.dashboard.cards.businesses")}
                            value={format(data.businesses.total)}
                            detail={t("admin.dashboard.cards.businessesDesc")}
                            icon={Building2}
                        />
                        <StatCard
                            title={t("admin.dashboard.cards.marketDensity")}
                            value={format(data.avgCompetitors)}
                            detail={t("admin.dashboard.cards.marketDensityDesc")}
                            icon={Target}
                        />
                        <StatCard
                            title={t("admin.dashboard.cards.reportHealth")}
                            value={format(data.reports.failed)}
                            detail={t("admin.dashboard.cards.reportHealthDesc", { pending: format(data.reports.pending) })}
                            icon={AlertTriangle}
                            tone={data.reports.failed > 0 ? "warning" : undefined}
                        />
                    </div>

                    <OverviewCharts
                        series={data.series}
                        typeDistribution={data.typeDistribution}
                        periodDays={data.periodDays}
                    />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ApiUsageChart data={usage.data} />
                        <TopConsumersTable data={consumers.data} />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

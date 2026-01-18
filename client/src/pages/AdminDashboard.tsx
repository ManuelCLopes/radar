
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, Building2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { OverviewCharts } from "@/components/admin/OverviewCharts";
import { ApiUsageChart } from "@/components/admin/ApiUsageChart";
import { TopConsumersTable } from "@/components/admin/TopConsumersTable";

interface AdminStats {
    totalUsers: number;
    totalReports: number;
    totalBusinesses: number;
    recentReports: any[];
    userGrowth: any[];
    reportStats: any[];
    typeDistribution?: { type: string; count: number }[];
    topLocations?: { address: string; count: number }[];
    avgCompetitors?: number;
    conversionRate?: number;
}

export default function AdminDashboard() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!isAuthLoading && (!user || user.role !== "admin")) {
            setLocation("/");
        }
    }, [user, isAuthLoading, setLocation]);

    const { data: stats, isLoading: isStatsLoading } = useQuery<AdminStats>({
        queryKey: ["/api/admin/analytics"],
        enabled: !!user && user.role === "admin",
    });

    const { data: cardsData, isLoading: isCardsLoading } = useQuery<AdminStats>({
        queryKey: ["/api/admin/stats"],
        enabled: !!user && user.role === "admin",
    });

    const { data: usageData, isLoading: isUsageLoading } = useQuery({
        queryKey: ["/api/admin/usage"],
        enabled: !!user && user.role === "admin",
    });

    const { data: topConsumers, isLoading: isConsumersLoading } = useQuery({
        queryKey: ["/api/admin/usage/users"],
        enabled: !!user && user.role === "admin",
    });

    if (isAuthLoading || isStatsLoading || isCardsLoading || isUsageLoading || isConsumersLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <AdminLayout>
            <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                        <p className="text-muted-foreground">Welcome back, {user.firstName || "Admin"}.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-900/20">
                                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.totalUsers || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-emerald-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                            <div className="p-2 bg-emerald-100 rounded-full dark:bg-emerald-900/20">
                                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.totalReports || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                            <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/20">
                                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.totalBusinesses || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-amber-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Top Activity</CardTitle>
                            <div className="p-2 bg-amber-100 rounded-full dark:bg-amber-900/20">
                                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.recentReports?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">Recent generated reports</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-pink-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                            <div className="p-2 bg-pink-100 rounded-full dark:bg-pink-900/20">
                                <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.conversionRate ? stats.conversionRate.toFixed(1) : 0}%</div>
                            <p className="text-xs text-muted-foreground">Searches to Reports</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-cyan-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Market Density</CardTitle>
                            <div className="p-2 bg-cyan-100 rounded-full dark:bg-cyan-900/20">
                                <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.avgCompetitors || 0}</div>
                            <p className="text-xs text-muted-foreground">Avg. competitors found</p>
                        </CardContent>
                    </Card>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ApiUsageChart data={usageData as any} />
                    <TopConsumersTable data={topConsumers as any} />
                </div>

                <OverviewCharts data={stats as any} />
            </div>
        </AdminLayout >
    );
}

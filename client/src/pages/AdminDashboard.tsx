
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, Building2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { OverviewCharts } from "@/components/admin/OverviewCharts";

interface AdminStats {
    totalUsers: number;
    totalReports: number;
    totalBusinesses: number;
    recentReports: any[];
    userGrowth: any[];
    reportStats: any[];
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

    // Also fetch basic stats for the cards (or use analytics if combined)
    // Actually the analytics endpoint we made returns growth data. 
    // We should probably update the /stats endpoint to include growth or just use two queries.
    // Let's use the stats endpoint for cards and analytics for charts.

    const { data: cardsData, isLoading: isCardsLoading } = useQuery<AdminStats>({
        queryKey: ["/api/admin/stats"],
        enabled: !!user && user.role === "admin",
    });

    if (isAuthLoading || isStatsLoading || isCardsLoading) {
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.totalUsers || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.totalReports || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.totalBusinesses || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cardsData?.recentReports?.length || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <OverviewCharts data={stats as any} />
            </div>
        </AdminLayout>
    );
}

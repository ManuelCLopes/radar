import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Users, FileText, Building2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface AdminStats {
    totalUsers: number;
    totalReports: number;
    totalBusinesses: number;
    recentReports: any[];
}

export default function AdminDashboard() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [, setLocation] = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        if (!isAuthLoading && (!user || user.role !== "admin")) {
            setLocation("/");
        }
    }, [user, isAuthLoading, setLocation]);

    const { data: stats, isLoading: isStatsLoading } = useQuery<AdminStats>({
        queryKey: ["/api/admin/stats"],
        enabled: !!user && user.role === "admin",
    });

    if (isAuthLoading || isStatsLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Businesses</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBusinesses || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time not implemented
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Generated At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats?.recentReports?.map((report: any) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">
                                        {report.businessName}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(report.generatedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Actions can be added here */}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!stats?.recentReports || stats.recentReports.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No recent reports found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

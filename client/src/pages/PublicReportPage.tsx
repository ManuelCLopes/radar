import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ReportContent } from "@/components/ReportContent";
import type { Report, Business } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Star, TrendingUp, Users, ArrowRight, ShieldAlert } from "lucide-react";

function StatCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PublicReportPage() {
    const { token } = useParams();
    const { t } = useTranslation();

    const { data: report, isLoading, error } = useQuery<Report>({
        queryKey: [`/api/reports/public/${token}`],
        retry: false,
    });

    const { data: business } = useQuery<Business>({
        queryKey: [`/api/businesses/${report?.businessId}`],
        enabled: !!report?.businessId,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    <p className="text-muted-foreground">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>{t("report.public.notFoundTitle")}</CardTitle>
                        <CardDescription>{t("report.public.notFoundDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button asChild className="w-full">
                            <Link href="/">
                                {t("common.backToHome")}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/10">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        Competitor Watcher
                    </div>
                    <Button size="sm" asChild>
                        <Link href="/auth?mode=register">
                            {t("previewReport.benefits.signupToSave")} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </nav>

            <main className="container py-8 space-y-8">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{report.businessName}</h1>
                            <p className="text-muted-foreground">
                                {t("report.view.generatedOn")} {new Date(report.generatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={Building2}
                            label={t("dashboard.stats.analyzed")}
                            value={report.competitors.length}
                        />
                        <StatCard
                            icon={Star}
                            label={t("dashboard.stats.avgRating")}
                            value={
                                report.competitors.length > 0
                                    ? (report.competitors.reduce((acc, c) => acc + (c.rating || 0), 0) / report.competitors.length).toFixed(1)
                                    : "-"
                            }
                        />
                        <StatCard
                            icon={TrendingUp}
                            label={t("dashboard.stats.marketActivity")}
                            value={report.marketTrends ? Object.keys(report.marketTrends).length : 0}
                        />
                        <StatCard
                            icon={Users}
                            label={t("report.stats.reviewsAnalyzed")}
                            value={report.competitors.reduce((acc, c) => acc + (c.userRatingsTotal || 0), 0).toLocaleString()}
                        />
                    </div>
                </div>

                {/* Report Content */}
                <div className="bg-background rounded-lg border shadow-sm p-6 sm:p-8">
                    <ReportContent report={report} business={business} isGuest={true} />
                </div>

                {/* CTA Footer */}
                <div className="bg-primary/5 rounded-lg border p-8 text-center space-y-4">
                    <h2 className="text-2xl font-bold">{t("report.public.ctaTitle")}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t("report.public.ctaDesc")}
                    </p>
                    <Button size="lg" asChild className="mt-4">
                        <Link href="/auth?mode=register">
                            {t("previewReport.benefits.signupToSave")}
                        </Link>
                    </Button>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 md:px-8 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built by Competitor Watcher AI.
                    </p>
                </div>
            </footer>
        </div>
    );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BarChart3, TrendingUp, Building2, MapPin, LogOut } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BusinessForm } from "@/components/BusinessForm";
import { BusinessList } from "@/components/BusinessList";
import { ReportView } from "@/components/ReportView";
import { ReportHistory } from "@/components/ReportHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Business, InsertBusiness, Report } from "@shared/schema";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historyBusiness, setHistoryBusiness] = useState<Business | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const { data: businesses = [], isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: InsertBusiness) => {
      const response = await apiRequest("POST", "/api/businesses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: t("toast.businessRegistered.title"),
        description: t("toast.businessRegistered.description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error.title"),
        description: error.message || t("toast.error.registerBusiness"),
        variant: "destructive",
      });
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const response = await apiRequest("DELETE", `/api/businesses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: t("toast.businessDeleted.title"),
        description: t("toast.businessDeleted.description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error.title"),
        description: error.message || t("toast.error.deleteBusiness"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (id: string) => {
      setGeneratingReportId(id);
      const response = await apiRequest("POST", `/api/run-report/${id}`, { language: i18n.language });
      return response.json();
    },
    onSuccess: (report: Report) => {
      setCurrentReport(report);
      setReportDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/reports/business"] });
      toast({
        title: t("toast.reportGenerated.title"),
        description: t("toast.reportGenerated.description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error.title"),
        description: error.message || t("toast.error.generateReport"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setGeneratingReportId(null);
    },
  });

  const handleSubmit = async (data: InsertBusiness) => {
    await createBusinessMutation.mutateAsync(data);
  };

  const handleGenerateReport = (id: string) => {
    generateReportMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteBusinessMutation.mutate(id);
  };

  const handleViewHistory = (business: Business) => {
    setHistoryBusiness(business);
    setHistoryDialogOpen(true);
  };

  const handleViewReportFromHistory = (report: Report) => {
    setHistoryDialogOpen(false);
    setCurrentReport(report);
    setReportDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{t("dashboard.header.title")}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {t("app.description")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} className="object-cover" />
                      <AvatarFallback>
                        {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : t("dashboard.user.guest")}
                      </p>
                      {user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer" data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("dashboard.user.logout")}</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-3 sm:gap-4 mb-8 grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" data-testid="stat-total-businesses">
                  {businesses.length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("dashboard.stats.registeredBusinesses")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-chart-2" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" data-testid="stat-active-analyses">
                  {businesses.length > 0 ? t("dashboard.stats.active") : "Ready"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("dashboard.stats.analysisStatus")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-chart-3" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" data-testid="stat-locations">
                  {new Set(businesses.filter(b => b.latitude !== null && b.longitude !== null).map(b => `${b.latitude!.toFixed(2)},${b.longitude!.toFixed(2)}`)).size}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("dashboard.stats.uniqueLocations")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-chart-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold" data-testid="stat-types">
                  {new Set(businesses.map(b => b.type)).size}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("dashboard.stats.businessTypes")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 min-w-0">
          <div className="order-2 lg:order-1 min-w-0">
            <BusinessList
              businesses={businesses}
              isLoading={isLoading}
              onGenerateReport={handleGenerateReport}
              onDelete={handleDelete}
              onViewHistory={handleViewHistory}
              generatingReportId={generatingReportId}
              deletingId={deletingId}
            />
          </div>
          <div className="order-1 lg:order-2 min-w-0">
            <BusinessForm
              onSubmit={handleSubmit}
              isPending={createBusinessMutation.isPending}
            />
          </div>
        </div>
      </main>

      <ReportView
        report={currentReport}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />

      <ReportHistory
        business={historyBusiness}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        onViewReport={handleViewReportFromHistory}
      />
    </div>
  );
}

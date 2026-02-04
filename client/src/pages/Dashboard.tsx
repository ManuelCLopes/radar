import { useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin, Star, Plus, Edit, Trash2, LogOut, FileText, History, AlertCircle, Settings, Building2, Search, Loader2, TrendingUp, Navigation } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BusinessForm } from "@/components/BusinessForm";
import { BusinessList } from "@/components/BusinessList";
import { RadiusSelector } from "@/components/RadiusSelector";
import { ReportView } from "@/components/ReportView";
import { ReportHistory } from "@/components/ReportHistory";
import { CompetitorMap } from "@/components/CompetitorMap";
import { TrendsDashboard } from "@/components/TrendsDashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Business, type InsertBusiness, type Report, businessTypes } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePricingModal } from "@/context/PricingModalContext";

const analysisSchema = z.object({
  address: z.string().min(1, "Address is required"),
  type: z.string().min(1, "Business type is required"),
  radius: z.union([z.string(), z.number()]).transform((val) => typeof val === 'string' ? parseInt(val, 10) : val),
});

type AnalysisFormValues = z.infer<typeof analysisSchema>;

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const { openPricing } = usePricingModal();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [historyBusiness, setHistoryBusiness] = useState<Business | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedMapBusinessId, setSelectedMapBusinessId] = useState<string>("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return tab === "history" || tab === "businesses" ? tab : "businesses";
  });

  // Analysis Form
  const analysisForm = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      address: "",
      type: "",
      radius: 1000,
    },
  });

  const { data: businesses = [], isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const { data: reportHistory = [], isLoading: isLoadingHistory } = useQuery<Report[]>({
    queryKey: ["/api/reports/history"],
  });

  const stats = {
    totalBusinesses: businesses.length,
    totalReports: reportHistory.length,
    totalCompetitors: reportHistory.reduce((acc, r) => acc + (r.competitors?.length || 0), 0),
    uniqueLocations: new Set(businesses.map(b => b.address)).size,
    businessTypes: new Set(businesses.map(b => b.type)).size,
  };

  const createBusinessMutation = useMutation({
    mutationFn: async (data: InsertBusiness) => {
      const res = await apiRequest("POST", "/api/businesses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: t("toast.businessRegistered.title"),
        description: t("toast.businessRegistered.description"),
      });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error.title"),
        description: error.message || t("toast.error.registerBusiness"),
        variant: "destructive",
      });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertBusiness }) => {
      const res = await apiRequest("PUT", `/api/businesses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: t("dashboard.businessUpdated"),
        description: t("dashboard.businessUpdatedDesc"),
      });
      setEditingBusiness(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error.title"),
        description: error.message,
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

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingReportId(id);
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/business"] });
      toast({
        title: t("toast.reportDeleted.title"),
        description: t("toast.reportDeleted.description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error.title"),
        description: error.message || t("toast.error.deleteReport", "Failed to delete report"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingReportId(null);
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
      queryClient.invalidateQueries({ queryKey: ["/api/reports/history"] });
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

  const runAnalysisMutation = useMutation({
    mutationFn: async (data: AnalysisFormValues) => {
      const response = await apiRequest("POST", "/api/analyze-address", { ...data, language: i18n.language });
      return response.json();
    },
    onSuccess: (report: Report) => {
      setCurrentReport(report);
      setReportDialogOpen(true);
      setIsAnalysisOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/reports/history"] });
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
  });

  const handleAnalysisSubmit = (data: AnalysisFormValues) => {
    if (user && !user.isVerified) {
      toast({
        title: t("common.verificationRequired"),
        description: t("common.pleaseVerifyEmail"),
        variant: "destructive",
      });
      return;
    }
    runAnalysisMutation.mutate(data);
  };

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: t("toast.error.title"),
        description: t("addressSearch.locationFailed"),
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsGettingLocation(false);
        const { latitude, longitude } = position.coords;

        setManualCoordinates({
          lat: latitude,
          lng: longitude
        });

        try {
          const response = await fetch('/api/places/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              analysisForm.setValue("address", data.address);
              toast({
                title: t("addressSearch.locationObtained"),
                description: t("addressSearch.locationObtainedDesc"),
              });
            } else {
              throw new Error("No address found");
            }
          } else {
            throw new Error("Reverse geocoding failed");
          }
        } catch (e) {
          // Error - Clear form and show toast
          analysisForm.setValue("address", "");
          setManualCoordinates(null);
          toast({
            title: t("toast.error.title"),
            description: t("addressSearch.locationUnavailable"),
            variant: "destructive",
          });
        }
      },
      (error) => {
        setIsGettingLocation(false);
        analysisForm.setValue("address", ""); // Clear loading text

        let errorMessage = t("addressSearch.locationFailed");
        if (error.code === 1) errorMessage = t("addressSearch.locationDenied");

        toast({
          title: t("toast.error.title"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
  }, [analysisForm, t, toast]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleGenerateReport = useCallback((id: string) => {
    if (user && !user.isVerified) {
      toast({
        title: t("common.verificationRequired"),
        description: t("common.pleaseVerifyEmail"),
        variant: "destructive",
      });
      return;
    }
    generateReportMutation.mutate(id);
  }, [generateReportMutation, user, toast, t]);

  const handleDeleteBusiness = useCallback((id: string) => {
    deleteBusinessMutation.mutate(id);
  }, [deleteBusinessMutation]);

  const handleViewHistory = useCallback((business: Business) => {
    setHistoryBusiness(business);
    setHistoryDialogOpen(true);
  }, []);

  const handleEdit = useCallback((business: Business) => {
    setEditingBusiness(business);
  }, []);



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center cursor-pointer transition-opacity hover:opacity-80">
            <img src="/logo-dark.png" alt="Competitor Watcher" className="h-10 w-auto dark:hidden" />
            <img src="/logo.png" alt="Competitor Watcher" className="h-10 w-auto hidden dark:block" />
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              title="Subscrição"
              onClick={openPricing}
            >
              <Star className="h-5 w-5 text-amber-500" />
              <span className="sr-only">Subscrição</span>
            </Button>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                title="Definições"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Definições</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="expandable-btn text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              title={t("dashboard.user.logout")}
            >
              <LogOut className="h-5 w-5" />
              <span aria-hidden="true">{t("dashboard.user.logout")}</span>
              <span className="sr-only">{t("dashboard.user.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                const url = new URL(window.location.href);
                url.searchParams.set("tab", val);
                window.history.replaceState({}, "", url.toString());
              }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <TabsList className="flex w-auto">
                  <TabsTrigger value="businesses" className="group flex items-center" data-testid="tab-businesses">
                    <Building2 className="h-4 w-4" />
                    <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-data-[state=active]:max-w-[150px] group-data-[state=active]:opacity-100 group-data-[state=active]:ml-2 sm:max-w-none sm:opacity-100 sm:ml-2 sm:inline">
                      {t("dashboard.tabs.businesses")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="group flex items-center" data-testid="tab-history">
                    <History className="h-4 w-4" />
                    <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-data-[state=active]:max-w-[150px] group-data-[state=active]:opacity-100 group-data-[state=active]:ml-2 sm:max-w-none sm:opacity-100 sm:ml-2 sm:inline">
                      {t("dashboard.tabs.history")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="group flex items-center" data-testid="tab-trends">
                    <TrendingUp className="h-4 w-4" />
                    <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-data-[state=active]:max-w-[150px] group-data-[state=active]:opacity-100 group-data-[state=active]:ml-2 sm:max-w-none sm:opacity-100 sm:ml-2 sm:inline">
                      {t("trends.title", "Trends")}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <Button onClick={() => setIsAddOpen(true)} className="gap-2" data-testid="btn-add-business">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("dashboard.addBusiness")}</span>
                  </Button>
                  <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2" data-testid="btn-new-analysis">
                        <Search className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("dashboard.tabs.newAnalysis")}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>{t("dashboard.analysis.title")}</DialogTitle>
                        <DialogDescription>
                          {t("dashboard.analysis.description")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Form {...analysisForm}>
                          <form onSubmit={analysisForm.handleSubmit(handleAnalysisSubmit)} className="space-y-6">
                            <FormField
                              control={analysisForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("business.form.address")}</FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder={t("dashboard.analysis.addressPlaceholder")}
                                        className="pr-10"
                                      />
                                    </FormControl>
                                    <button
                                      type="button"
                                      onClick={handleUseCurrentLocation}
                                      disabled={isGettingLocation}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                                      title={t("addressSearch.useCurrentLocation")}
                                    >
                                      {isGettingLocation ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                      ) : (
                                        <Navigation className={`h-4 w-4 ${manualCoordinates ? 'text-blue-600 fill-blue-100' : ''}`} />
                                      )}
                                    </button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={analysisForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("business.form.type")}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("business.form.typePlaceholder")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[100]" usePortal={false}>
                                      <SelectItem value="restaurant">🍽️ {t("businessTypes.restaurant")}</SelectItem>
                                      <SelectItem value="cafe">☕ {t("businessTypes.cafe")}</SelectItem>
                                      <SelectItem value="retail">🛍️ {t("businessTypes.retail")}</SelectItem>
                                      <SelectItem value="gym">💪 {t("businessTypes.gym")}</SelectItem>
                                      <SelectItem value="salon">💇 {t("businessTypes.salon")}</SelectItem>
                                      <SelectItem value="hotel">🏨 {t("businessTypes.hotel")}</SelectItem>
                                      <SelectItem value="bar">🍺 {t("businessTypes.bar")}</SelectItem>
                                      <SelectItem value="bakery">🥖 {t("businessTypes.bakery")}</SelectItem>
                                      <SelectItem value="pharmacy">💊 {t("businessTypes.pharmacy")}</SelectItem>
                                      <SelectItem value="supermarket">🛒 {t("businessTypes.supermarket")}</SelectItem>
                                      <SelectItem value="clinic">🏥 {t("businessTypes.clinic")}</SelectItem>
                                      <SelectItem value="dentist">🦷 {t("businessTypes.dentist")}</SelectItem>
                                      <SelectItem value="bank">🏦 {t("businessTypes.bank")}</SelectItem>
                                      <SelectItem value="gas_station">⛽ {t("businessTypes.gas_station")}</SelectItem>
                                      <SelectItem value="car_repair">🔧 {t("businessTypes.car_repair")}</SelectItem>
                                      <SelectItem value="other">🏢 {t("businessTypes.other")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={analysisForm.control}
                              name="radius"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("quickSearch.selectRadius")}</FormLabel>
                                  <FormControl>
                                    <RadiusSelector
                                      value={typeof field.value === 'string' ? parseInt(field.value) : field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button type="submit" className="w-full" disabled={runAnalysisMutation.isPending}>
                              {runAnalysisMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t("business.list.generating")}
                                </>
                              ) : (
                                t("quickSearch.analyzeButton")
                              )}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Businesses Tab */}
              <TabsContent value="businesses" className="space-y-6">

                {/* Stats Section */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("dashboard.stats.registeredBusinesses")}
                      </CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("dashboard.stats.analysisStatus")}
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalReports}</div>
                      <p className="text-xs text-muted-foreground">
                        {t("report.history.competitorsAnalyzed", { count: stats.totalCompetitors })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("dashboard.stats.uniqueLocations")}
                      </CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.uniqueLocations}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("dashboard.stats.businessTypes")}
                      </CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.businessTypes}</div>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.stats.active")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Business List Section */}
                <BusinessList
                  businesses={businesses}
                  isLoading={isLoading}
                  onDelete={handleDeleteBusiness}
                  onGenerateReport={handleGenerateReport}
                  generatingReportId={generatingReportId}
                  deletingId={deletingId}
                  onViewHistory={handleViewHistory}
                  onEdit={handleEdit}
                />

                {/* Map Section */}
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>{t("dashboard.map.title")}</CardTitle>
                      <CardDescription>{t("dashboard.map.description")}</CardDescription>
                    </div>
                    <div className="w-[200px]">
                      <Select
                        value={selectedMapBusinessId}
                        onValueChange={setSelectedMapBusinessId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("dashboard.map.selectBusiness")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("dashboard.map.allBusinesses")}</SelectItem>
                          {businesses.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {businesses.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground">
                        {t("business.list.empty")}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          const businessesToShow = selectedMapBusinessId === "all"
                            ? businesses
                            : businesses.filter(b => b.id === selectedMapBusinessId);

                          if (businessesToShow.length === 0) return null;

                          const targetBusiness = selectedMapBusinessId === "all" ? businesses[0] : businesses.find(b => b.id === selectedMapBusinessId);

                          if (!targetBusiness) return null;

                          // Find latest report for this business to get competitors
                          const latestReport = reportHistory.find(r => r.businessId === targetBusiness.id);

                          if (!targetBusiness.latitude || !targetBusiness.longitude) {
                            return (
                              <div className="text-center p-8 text-muted-foreground">
                                {t("dashboard.map.noLocation")}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              {selectedMapBusinessId === "all" && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {t("dashboard.map.showingFirst", { name: targetBusiness.name })}
                                </p>
                              )}
                              <CompetitorMap
                                center={{ lat: targetBusiness.latitude, lng: targetBusiness.longitude }}
                                businessName={targetBusiness.name}
                                competitors={latestReport?.competitors || []}
                                radius={1500} // Default radius
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{t("dashboard.analysis.historyTitle")}</CardTitle>
                      <CardDescription>
                        {t("dashboard.analysis.historyDescription")}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/reports/history"] })}>
                      <History className="h-4 w-4 mr-2" />
                      {t("common.refresh")}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : !reportHistory?.length ? (
                      <div className="text-center p-8 text-muted-foreground">
                        {t("dashboard.analysis.noReports")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reportHistory.map((report) => (
                          <Card key={report.id}>
                            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 sm:gap-0">
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className={`p-2 rounded-full ${report.businessId ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                                  {report.businessId ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {report.businessId
                                      ? report.businessName
                                      : t("dashboard.analysis.reportTitle", {
                                        name: report.businessName.replace(/^Analysis: /, '')
                                      })
                                    }
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-1">
                                    <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{new Date(report.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {report.radius && (
                                      <>
                                        <span className="hidden sm:inline">•</span>
                                        <span>{report.radius >= 1000 ? `${report.radius / 1000}km` : `${report.radius}m`}</span>
                                      </>
                                    )}
                                    {report.businessId && (
                                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20 whitespace-nowrap">
                                        {t("dashboard.analysis.businessReport")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentReport(report);
                                    setReportDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  {t("report.history.view")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReportToDelete(report);
                                  }}
                                  disabled={deletingReportId === report.id}
                                >
                                  {deletingReportId === report.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Label>{t("trends.selectBusiness", "Select Business:")}</Label>
                    <Select
                      value={selectedMapBusinessId}
                      onValueChange={setSelectedMapBusinessId}
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder={t("trends.selectBusinessPlaceholder", "Select a business")} />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMapBusinessId && selectedMapBusinessId !== "all" ? (
                    <TrendsDashboard
                      business={businesses.find(b => b.id === selectedMapBusinessId)!}
                    />
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">{t("trends.selectToView", "Select a business to view trends")}</h3>
                      <p className="text-muted-foreground mt-2">
                        {t("trends.selectToViewDesc", "Choose one of your registered businesses to see its historical performance.")}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </main>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.addBusiness")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.addBusinessDesc")}
            </DialogDescription>
          </DialogHeader>
          <BusinessForm
            onSubmit={async (data) => {
              await createBusinessMutation.mutateAsync(data);
            }}
            isPending={createBusinessMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBusiness} onOpenChange={(open) => !open && setEditingBusiness(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.editBusiness")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.editBusinessDesc")}
            </DialogDescription>
          </DialogHeader>
          {editingBusiness && (
            <BusinessForm
              initialValues={{
                name: editingBusiness.name,
                type: editingBusiness.type,
                address: editingBusiness.address || "",
              }}
              onSubmit={async (data) => {
                if (editingBusiness) {
                  await updateBusinessMutation.mutateAsync({
                    id: editingBusiness.id,
                    data,
                  });
                }
              }}
              isPending={updateBusinessMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportView
        report={currentReport || selectedReport}
        open={reportDialogOpen || reportViewOpen}
        onOpenChange={(open) => {
          setReportDialogOpen(open);
          setReportViewOpen(open);
          if (!open) setSelectedReport(null);
        }}
      />

      {/* Business History Dialog */}
      {
        historyBusiness && (
          <ReportHistory
            business={historyBusiness}
            open={historyDialogOpen}
            onOpenChange={setHistoryDialogOpen}
            onViewReport={(report) => {
              setCurrentReport(report);
              setReportDialogOpen(true);
              setHistoryDialogOpen(false);
            }}
          />
        )
      }

      {/* Delete Report Confirmation Dialog */}
      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("report.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("report.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("report.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reportToDelete) {
                  deleteReportMutation.mutate(reportToDelete.id);
                  setReportToDelete(null);
                }
              }}
            >
              {t("report.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BarChart3, TrendingUp, Building2, MapPin, LogOut, Search, History, FileText, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BusinessForm } from "@/components/BusinessForm";
import { BusinessList } from "@/components/BusinessList";
import { ReportView } from "@/components/ReportView";
import { ReportHistory } from "@/components/ReportHistory";
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
import { type Business, type InsertBusiness, type Report, businessTypes } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historyBusiness, setHistoryBusiness] = useState<Business | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportViewOpen, setReportViewOpen] = useState(false);

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
    runAnalysisMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer transition-opacity hover:opacity-80">
            <BarChart3 className="h-6 w-6" />
            <span>Radar</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
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
            <Tabs defaultValue="businesses" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="flex w-auto">
                  <TabsTrigger value="businesses" className="group flex items-center">
                    <Building2 className="h-4 w-4" />
                    <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-data-[state=active]:max-w-[150px] group-data-[state=active]:opacity-100 group-data-[state=active]:ml-2 sm:max-w-none sm:opacity-100 sm:ml-2 sm:inline">
                      {t("dashboard.tabs.businesses")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="group flex items-center">
                    <History className="h-4 w-4" />
                    <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-data-[state=active]:max-w-[150px] group-data-[state=active]:opacity-100 group-data-[state=active]:ml-2 sm:max-w-none sm:opacity-100 sm:ml-2 sm:inline">
                      {t("dashboard.tabs.history")}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Search className="h-4 w-4" />
                      {t("dashboard.tabs.newAnalysis")}
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
                                <FormControl>
                                  <Input {...field} placeholder={t("dashboard.analysis.addressPlaceholder")} />
                                </FormControl>
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
                                  <SelectContent>
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
                                <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("quickSearch.selectRadius")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="500">{t("radiusOptions.500m")}</SelectItem>
                                    <SelectItem value="1000">{t("radiusOptions.1km")}</SelectItem>
                                    <SelectItem value="2000">{t("radiusOptions.2km")}</SelectItem>
                                    <SelectItem value="5000">{t("radiusOptions.5km")}</SelectItem>
                                  </SelectContent>
                                </Select>
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

              {/* Businesses Tab */}
              <TabsContent value="businesses" className="space-y-6">

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
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
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

                <div className="grid gap-6 md:grid-cols-12">
                  <div className="md:col-span-12 lg:col-span-8">
                    <BusinessList
                      businesses={businesses}
                      isLoading={isLoading}
                      onDelete={(id) => deleteBusinessMutation.mutate(id)}
                      onGenerateReport={(id) => generateReportMutation.mutate(id)}
                      generatingReportId={generatingReportId}
                      deletingId={deletingId}
                      onViewHistory={(business) => {
                        setHistoryBusiness(business);
                        setHistoryDialogOpen(true);
                      }}
                    />
                  </div>

                  <div className="md:col-span-12 lg:col-span-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("dashboard.registerBusiness")}</CardTitle>
                        <CardDescription>{t("dashboard.registerBusinessDesc")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BusinessForm onSubmit={(data) => createBusinessMutation.mutateAsync(data)} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
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
                      Refresh
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
                            <CardContent className="flex items-center justify-between p-4">
                              <div>
                                <p className="font-medium">{report.businessName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(report.generatedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setReportViewOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  {t("report.history.view")}
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
            </Tabs>
          </div>
        </div>
      </main>

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
      {historyBusiness && (
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
      )}
    </div>
  );
}

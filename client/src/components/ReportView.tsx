import { useState } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Download, Building2, Star, MapPin, Brain, Users, FileText, Printer, Mail, DollarSign, TrendingUp, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, Megaphone, MessageSquare, Globe, TrendingDown, Lightbulb, Frown, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from "./PDFReport";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Report, Business } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { ReportContent } from "./ReportContent";

import { Switch as ToggleSwitch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ReportViewProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint?: () => void;
  isGuest?: boolean;
}

const emailSchema = z.string().email();

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

export function ReportView({ report, open, onOpenChange, onPrint, isGuest }: ReportViewProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailError, setEmailError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const shareMutation = useMutation({
    mutationFn: async (isShared: boolean) => {
      const res = await apiRequest("POST", `/api/reports/${report?.id}/share`, { isShared });
      return await res.json();
    },
    onSuccess: (updatedReport) => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${report?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reports`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/history`] });

      toast({
        title: updatedReport.isShared ? t("report.share.enabled") : t("report.share.disabled"),
        description: updatedReport.isShared ? t("report.share.enabledDesc") : t("report.share.disabledDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("toast.error.title"),
        description: t("toast.error.shareUpdate"),
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", `/api/reports/${report?.id}/email`, {
        email,
        language: i18n.language
      });
    },
    onSuccess: () => {
      setEmailOpen(false);
      setEmailTo("");
      toast({
        title: t("toast.emailSent.title"),
        description: t("toast.emailSent.description"),
      });
    },
    onError: (error: Error) => {
      let message = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.message) message = parsed.message;
        if (parsed.error) message = parsed.error;
      } catch (e) {
      }

      toast({
        title: t("toast.error.title"),
        description: message || t("toast.error.sendEmail"),
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    if (report?.shareToken) {
      const url = `${window.location.origin}/r/${report.shareToken}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t("common.copied"),
        description: t("report.share.linkCopied"),
      });
    }
  };

  const { data: business } = useQuery<Business>({
    queryKey: [`/api/businesses/${report?.businessId}`],
    enabled: !!report?.businessId,
  });

  if (!report) return null;

  const handlePrintPDF = () => {
    onPrint?.();
  };

  const handleDownloadHTML = () => {
    const element = document.createElement("a");
    const file = new Blob([report.html || report.aiAnalysis], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${report.businessName.replace(/\s+/g, '_')}_report.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(emailTo);
    if (!result.success) {
      setEmailError(t("report.email.invalid"));
      return;
    }
    setEmailError("");
    sendEmailMutation.mutate(emailTo);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2" data-testid="report-title">
                  {report.businessName}
                  <Badge variant="outline" className="ml-2 font-normal">
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </Badge>
                  {report.isShared && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {t("report.view.comprehensiveAnalysis")}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {isGuest ? (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/auth?mode=register';
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    {t("previewReport.benefits.signupToSave")}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Share Button (Only for owner) */}
                    {report?.userId === user?.id && (
                      <Popover open={shareOpen} onOpenChange={setShareOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                            <Share2 className="h-4 w-4" />
                            {t("report.share.button")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                          <div className="p-4 bg-muted/30 border-b">
                            <h4 className="font-medium leading-none mb-1">{t("report.share.title")}</h4>
                            <p className="text-xs text-muted-foreground">
                              {t("report.share.description")}
                            </p>
                          </div>
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label htmlFor="share-toggle" className="text-sm font-medium">{t("report.share.publicAccess")}</Label>
                                <p className="text-[10px] text-muted-foreground">Anyone with the link can view</p>
                              </div>
                              <ToggleSwitch
                                id="share-toggle"
                                checked={report?.isShared || false}
                                onCheckedChange={(checked) => shareMutation.mutate(checked)}
                                disabled={shareMutation.isPending}
                              />
                            </div>
                            {report?.isShared && (
                              <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                  <label htmlFor="link" className="sr-only">
                                    Link
                                  </label>
                                  <div className="relative">
                                    <input
                                      id="link"
                                      className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
                                      defaultValue={`${window.location.origin}/r/${report.shareToken}`}
                                      readOnly
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                      <Globe className="h-3 w-3 text-muted-foreground/50" />
                                    </div>
                                  </div>
                                </div>
                                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={copyToClipboard}>
                                  {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-export-report">
                          <Download className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{t("report.view.export")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handlePrintPDF}>
                          <Printer className="mr-2 h-4 w-4" />
                          {t("report.actions.print")}
                        </DropdownMenuItem>
                        {/* Mobile Share Option */}
                        {report?.userId === user?.id && (
                          <DropdownMenuItem onClick={() => setShareOpen(true)} className="sm:hidden">
                            <Share2 className="mr-2 h-4 w-4" />
                            {t("report.share.button")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleDownloadHTML} data-testid="button-download-html">
                          <FileText className="h-4 w-4 mr-2" />
                          {t("report.view.downloadHtml")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEmailOpen(true)}>
                          <Mail className="mr-2 h-4 w-4" />
                          {t("report.actions.email")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <PDFDownloadLink
                            document={<PDFReport report={report} business={business} />}
                            fileName={`${business?.name || 'report'}-${new Date().toISOString().split('T')[0]}.pdf`}
                          >
                            {({ loading }) => (
                              <div className="flex items-center w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                {loading ? t("common.loading") : t("report.actions.downloadPDF")}
                              </div>
                            )}
                          </PDFDownloadLink>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6" id="report-content-area">
            {/* Report Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            <ReportContent report={report} business={business} isGuest={isGuest} />

            <div className="mt-8 pt-8 border-t flex justify-between text-xs text-muted-foreground print:hidden">
              <p>Generated by Competitor Watcher AI</p>
              <p>{new Date(report.generatedAt).toLocaleString()}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("report.actions.email")}</DialogTitle>
            <DialogDescription>
              {t("report.email.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={sendEmailMutation.isPending}>
                {sendEmailMutation.isPending && (
                  <Mail className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("report.actions.sendEmail")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, Calendar, Download, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report, Business } from "@shared/schema";

interface ReportHistoryProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewReport: (report: Report) => void;
}

function ReportSkeleton() {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyHistory({ t }: { t: (key: string) => string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t("report.history.empty")}</h3>
      </CardContent>
    </Card>
  );
}

export function ReportHistory({ business, open, onOpenChange, onViewReport }: ReportHistoryProps) {
  const { t } = useTranslation();
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports/business", business?.id],
    enabled: open && !!business?.id,
  });

  if (!business) return null;

  const handleDownload = (report: Report) => {
    const blob = new Blob([report.html || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report.businessName.toLowerCase().replace(/\s+/g, "-")}-${new Date(report.generatedAt).toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("report.history.title")}
          </DialogTitle>
          <DialogDescription>
            {t("report.history.description", { name: business.name })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(80vh-140px)]">
          <div className="p-6 space-y-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <ReportSkeleton key={i} />
                ))}
              </>
            ) : reports.length === 0 ? (
              <EmptyHistory t={t} />
            ) : (
              reports.map((report) => (
                <Card
                  key={report.id}
                  className="hover-elevate transition-all"
                  data-testid={`card-report-${report.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {t("report.view.title", "Report")}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.generatedAt).toLocaleDateString()} - {new Date(report.generatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t("report.history.competitorsAnalyzed", { count: report.competitors.length })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewReport(report)}
                          data-testid={`button-view-report-${report.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("report.history.view")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report)}
                          data-testid={`button-download-report-${report.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t("report.history.download")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { X, Download, Building2, Star, MapPin, Brain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Report, Competitor } from "@shared/schema";

interface ReportViewProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CompetitorCard({ competitor, index }: { competitor: Competitor; index: number }) {
  return (
    <Card className="hover-elevate" data-testid={`card-competitor-${index}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight">{competitor.name}</h4>
            {competitor.rating && (
              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 fill-current" />
                {competitor.rating.toFixed(1)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{competitor.address}</span>
          </p>
          {competitor.userRatingsTotal && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {competitor.userRatingsTotal.toLocaleString()} reviews
            </p>
          )}
          {competitor.distance && (
            <Badge variant="outline" className="text-xs">
              {competitor.distance}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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

export function ReportView({ report, open, onOpenChange }: ReportViewProps) {
  if (!report) return null;

  const handleDownload = () => {
    const blob = new Blob([report.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report.businessName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const avgRating = report.competitors.length > 0
    ? report.competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / report.competitors.filter(c => c.rating).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Competitor Analysis Report
              </DialogTitle>
              <DialogDescription>
                {report.businessName} - Generated {new Date(report.generatedAt).toLocaleString()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                data-testid="button-download-report"
              >
                <Download className="h-4 w-4 mr-2" />
                Download HTML
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Building2}
                label="Competitors Found"
                value={report.competitors.length}
              />
              <StatCard
                icon={Star}
                label="Avg. Rating"
                value={avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
              />
              <StatCard
                icon={Users}
                label="Total Reviews"
                value={report.competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0).toLocaleString()}
              />
            </div>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Analysis
              </h3>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-ai-analysis">
                    {report.aiAnalysis}
                  </p>
                </CardContent>
              </Card>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Nearby Competitors ({report.competitors.length})
              </h3>
              {report.competitors.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No competitors found in the nearby area.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.competitors.map((competitor, index) => (
                    <CompetitorCard key={index} competitor={competitor} index={index} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

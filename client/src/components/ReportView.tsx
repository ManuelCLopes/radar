import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Building2, Star, MapPin, Brain, Users, FileText, Printer, Mail, DollarSign, TrendingUp, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, Megaphone, MessageSquare, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Report, Competitor } from "@shared/schema";

interface ReportViewProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint?: () => void;
}

function CompetitorCard({ competitor, index, t }: { competitor: Competitor; index: number; t: (key: string, options?: Record<string, unknown>) => string }) {
  return (
    <Card className="hover-elevate" data-testid={`card-competitor-${index}`}>
      <CardContent className="p-4">
        <div className="space-y-3 min-w-0">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <h4 className="font-medium text-sm leading-tight min-w-0 break-words">{competitor.name}</h4>
              {competitor.rating && (
                <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                  <Star className="h-3 w-3 fill-current" />
                  {competitor.rating.toFixed(1)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-start gap-1 min-w-0">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2 break-words">{competitor.address}</span>
            </p>
            {competitor.userRatingsTotal && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {t("report.competitor.reviews", { count: competitor.userRatingsTotal.toLocaleString() })}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {competitor.distance && (
                <Badge variant="outline" className="text-xs">
                  {competitor.distance}
                </Badge>
              )}
              {competitor.priceLevel && (
                <Badge variant="outline" className="text-xs flex items-center gap-0.5">
                  <DollarSign className="h-2.5 w-2.5" />
                  {competitor.priceLevel}
                </Badge>
              )}
            </div>
          </div>

          {competitor.reviews && competitor.reviews.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-2 flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Recent Reviews
              </p>
              <div className="space-y-3">
                {competitor.reviews.map((review, i) => (
                  <ReviewItem key={i} review={review} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewItem({ review }: { review: any }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const hasOriginal = review.originalText && review.originalText !== review.text;

  return (
    <div className="bg-muted/50 p-3 rounded text-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{review.author}</span>
          {review.rating > 0 && (
            <div className="flex items-center text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`} />
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date(review.date).toLocaleDateString()}
        </span>
      </div>

      <p className="text-muted-foreground italic leading-relaxed">
        "{showOriginal ? review.originalText : review.text}"
      </p>

      {hasOriginal && (
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1"
        >
          <Globe className="h-2.5 w-2.5" />
          {showOriginal ? "Show Translated" : "Show Original"}
        </button>
      )}
    </div>
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

function SwotSection({ title, items, icon: Icon, colorClass }: { title: string, items: string[], icon: any, colorClass: string }) {
  if (!items.length) return null;
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium flex items-center gap-2 ${colorClass}`}>
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${colorClass.replace('text-', 'bg-')}`} />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function MarketTrends({ trends }: { trends: string[] }) {
  if (!trends.length) return null;
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <TrendingUp className="h-5 w-5" />
          Market Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trends.map((trend, i) => (
            <li key={i} className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border text-sm flex items-start gap-2">
              <ArrowUpRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              {trend}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ReportView({ report, open, onOpenChange, onPrint }: ReportViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  if (!report) return null;

  const handleDownloadHTML = () => {
    const blob = new Blob([report.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${report.businessName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: t("toast.reportDownloaded.title"),
      description: t("toast.reportDownloaded.description"),
    });
  };

  const handlePrintPDF = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${t("report.view.title")} - ${report.businessName}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #000; max-width: 800px; margin: 0 auto; padding: 2rem; }
              h1 { font-size: 24px; font-weight: bold; margin-bottom: 1rem; }
              h2 { font-size: 20px; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
              h3 { font-size: 18px; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
              p { margin-bottom: 1rem; }
              ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
              li { margin-bottom: 0.25rem; }
              .header { margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; }
              .meta { color: #666; font-size: 14px; margin-bottom: 2rem; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${t("report.view.title")}</h1>
              <div class="meta">
                <p><strong>Business:</strong> ${report.businessName}</p>
                <p><strong>Date:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
              </div>
            </div>
            ${report.html}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = () => window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
    toast({
      title: t("toast.printDialogOpened.title"),
      description: t("toast.printDialogOpened.description"),
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${t("report.view.title")} - ${report.businessName}`);
    const body = encodeURIComponent(`
${t("report.view.title")} - ${report.businessName}

${t("report.stats.competitorsFound")}: ${report.competitors.length}
${t("report.stats.avgRating")}: ${report.competitors.length > 0
        ? (report.competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / report.competitors.filter(c => c.rating).length).toFixed(1)
        : 'N/A'}

${t("report.sections.aiAnalysis")}:
${report.aiAnalysis}

---
Local Competitor Analyzer
    `.trim());

    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    toast({
      title: t("toast.emailClientOpened.title"),
      description: t("toast.emailClientOpened.description"),
    });
  };

  const avgRating = report.competitors.length > 0
    ? report.competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / report.competitors.filter(c => c.rating).length
    : 0;

  // Parse SWOT and Trends
  const swotRegex = /### SWOT Analysis([\s\S]*?)(?=###|$)/i;
  const trendsRegex = /### Market Trends([\s\S]*?)(?=###|$)/i;
  const targetAudienceRegex = /### Target Audience([\s\S]*?)(?=###|$)/i;
  const marketingRegex = /### Marketing Strategy([\s\S]*?)(?=###|$)/i;

  const swotMatch = report.aiAnalysis.match(swotRegex);
  const trendsMatch = report.aiAnalysis.match(trendsRegex);
  const targetAudienceMatch = report.aiAnalysis.match(targetAudienceRegex);
  const marketingMatch = report.aiAnalysis.match(marketingRegex);

  let swotData = { strengths: [], weaknesses: [], opportunities: [], threats: [] } as any;
  let trendsData: string[] = [];
  let targetAudienceData = { demographics: [], psychographics: [], painPoints: [], needs: [] } as any;
  let marketingData = { primaryChannels: [], contentIdeas: [], promotionalTactics: [] } as any;

  if (swotMatch) {
    const swotContent = swotMatch[1];
    const sections = {
      strengths: /#### Strengths([\s\S]*?)(?=####|$)/i,
      weaknesses: /#### Weaknesses([\s\S]*?)(?=####|$)/i,
      opportunities: /#### Opportunities([\s\S]*?)(?=####|$)/i,
      threats: /#### Threats([\s\S]*?)(?=####|$)/i
    };

    Object.entries(sections).forEach(([key, regex]) => {
      const match = swotContent.match(regex);
      if (match) {
        swotData[key] = match[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('-'))
          .map(line => line.substring(1).trim());
      }
    });
  }

  if (trendsMatch) {
    trendsData = trendsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.substring(1).trim());
  }

  if (targetAudienceMatch) {
    const content = targetAudienceMatch[1];
    const sections = {
      demographics: /- \*\*Demographics\*\*:([\s\S]*?)(?=- \*\*|$)/i,
      psychographics: /- \*\*Psychographics\*\*:([\s\S]*?)(?=- \*\*|$)/i,
      painPoints: /- \*\*Pain Points\*\*:([\s\S]*?)(?=- \*\*|$)/i,
      needs: /- \*\*Needs\*\*:([\s\S]*?)(?=- \*\*|$)/i
    };

    Object.entries(sections).forEach(([key, regex]) => {
      const match = content.match(regex);
      if (match) {
        // Handle single line or multi-line list
        const text = match[1].trim();
        if (text.startsWith('[')) {
          // If it's formatted like [Age, Income], split by comma
          targetAudienceData[key] = text.replace(/^\[|\]$/g, '').split(',').map(s => s.trim());
        } else {
          // Fallback or other format
          targetAudienceData[key] = [text];
        }
      }
    });
  }

  if (marketingMatch) {
    const content = marketingMatch[1];
    const sections = {
      primaryChannels: /- \*\*Primary Channels\*\*:([\s\S]*?)(?=- \*\*|$)/i,
      contentIdeas: /- \*\*Content Ideas\*\*:([\s\S]*?)(?=- \*\*|$)/i,
      promotionalTactics: /- \*\*Promotional Tactics\*\*:([\s\S]*?)(?=- \*\*|$)/i
    };

    Object.entries(sections).forEach(([key, regex]) => {
      const match = content.match(regex);
      if (match) {
        const text = match[1].trim();
        if (text.startsWith('[')) {
          marketingData[key] = text.replace(/^\[|\]$/g, '').split(',').map(s => s.trim());
        } else {
          marketingData[key] = [text];
        }
      }
    });
  }

  // Remove parsed sections from main content display
  const mainContent = report.aiAnalysis
    .replace(swotRegex, '')
    .replace(trendsRegex, '')
    .replace(targetAudienceRegex, '')
    .replace(marketingRegex, '')
    .trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] p-0 flex flex-col rounded-lg overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1 pr-8 sm:pr-0">
              <DialogTitle className="text-xl font-semibold flex flex-wrap items-center gap-2">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <span className="break-words">{t("report.view.title")}</span>
              </DialogTitle>
              <DialogDescription>
                {report.businessName} - {new Date(report.generatedAt).toLocaleString()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 sm:mr-12">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-export-report">
                    <Download className="h-4 w-4 mr-2" />
                    {t("report.view.export")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadHTML} data-testid="button-download-html">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("report.view.downloadHtml")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrintPDF} data-testid="button-print-pdf">
                    <Printer className="h-4 w-4 mr-2" />
                    {t("report.view.printPdf")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEmail} data-testid="button-email-report">
                    <Mail className="h-4 w-4 mr-2" />
                    {t("report.view.emailReport")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 break-words overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Building2}
                label={t("report.stats.competitorsFound")}
                value={report.competitors.length}
              />
              <StatCard
                icon={Star}
                label={t("report.stats.avgRating")}
                value={avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
              />
              <StatCard
                icon={Users}
                label={t("report.stats.totalReviews")}
                value={report.competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0).toLocaleString()}
              />
            </div>

            <Separator />

            {/* SWOT Analysis */}
            {swotMatch && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  SWOT Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SwotSection
                    title="Strengths"
                    items={swotData.strengths}
                    icon={CheckCircle2}
                    colorClass="text-green-600"
                  />
                  <SwotSection
                    title="Weaknesses"
                    items={swotData.weaknesses}
                    icon={XCircle}
                    colorClass="text-red-600"
                  />
                  <SwotSection
                    title="Opportunities"
                    items={swotData.opportunities}
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                  />
                  <SwotSection
                    title="Threats"
                    items={swotData.threats}
                    icon={AlertTriangle}
                    colorClass="text-orange-600"
                  />
                </div>
                <Separator className="mt-6" />
              </section>
            )}

            {/* Market Trends */}
            {trendsMatch && (
              <section>
                <MarketTrends trends={trendsData} />
                <Separator className="mt-6" />
              </section>
            )}

            {/* Target Audience */}
            {targetAudienceMatch && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Target Audience Persona
                </h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(targetAudienceData).map(([key, items]: [string, any]) => (
                        <div key={key}>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">{key}</h4>
                          <ul className="space-y-2">
                            {items.map((item: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Separator className="mt-6" />
              </section>
            )}

            {/* Marketing Strategy */}
            {marketingMatch && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Marketing Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(marketingData).map(([key, items]: [string, any]) => (
                    <Card key={key} className="bg-primary/5 border-primary/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {items.map((item: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator className="mt-6" />
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  {t("report.sections.aiAnalysis")}
                </h3>
                <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI-Powered Insights
                </Badge>
              </div>

              <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
                <CardContent className="p-0" data-testid="text-ai-analysis">
                  <div
                    className="prose prose-base dark:prose-invert max-w-none p-6 
                               [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:first:mt-0
                               [&>h2]:text-primary [&>h2]:flex [&>h2]:items-center [&>h2]:gap-2
                               [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-4 
                               [&>h3]:text-foreground/90 [&>h3]:border-l-4 [&>h3]:border-primary/30 [&>h3]:pl-3
                               [&>h4]:text-base [&>h4]:font-medium [&>h4]:mb-2 [&>h4]:text-foreground/80
                               [&>p]:text-foreground/80 [&>p]:leading-relaxed [&>p]:my-3
                               [&>ul]:my-3 [&>ul]:space-y-2
                               [&>ul>li]:text-foreground/80 [&>ul>li]:pl-2
                               [&>ul>li::marker]:text-primary
                               [&>ol]:my-3 [&>ol]:space-y-2
                               [&>ol>li]:text-foreground/80 [&>ol>li]:pl-2
                               [&>strong]:text-primary [&>strong]:font-semibold
                               [&>em]:text-foreground/70 [&>em]:italic
                               [&>hr]:my-6 [&>hr]:border-muted"
                    dangerouslySetInnerHTML={{ __html: mainContent }}
                  />
                </CardContent>
              </Card>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t("report.sections.nearbyCompetitors")} ({report.competitors.length})
              </h3>
              {report.competitors.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      {t("report.sections.noCompetitors")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.competitors.map((competitor, index) => (
                    <CompetitorCard key={index} competitor={competitor} index={index} t={t} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { AIAnalysisContent } from "@/components/AIAnalysisContent";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from "./PDFReport";
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
                {t("report.competitor.recentReviews")}
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

  const handleDownloadHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t("report.view.title")} - ${report.businessName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            .prose h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #111827; }
            .prose h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
            .prose p { margin-bottom: 1rem; line-height: 1.75; color: #4b5563; }
            .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
            .prose li { margin-bottom: 0.5rem; }
          </style>
        </head>
        <body class="bg-gray-50 p-4 md:p-8">
          <div class="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <!-- Header -->
            <div class="p-6 border-b bg-white">
              <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                ${t("report.view.title")}
              </h1>
              <p class="text-gray-500 mt-1">${report.businessName} - ${new Date(report.generatedAt).toLocaleString()}</p>
            </div>

            <div class="p-6 space-y-8">
              <!-- Metrics -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
                  <div class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">${report.competitors.length}</p>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">${t("report.stats.competitorsFound")}</p>
                  </div>
                </div>
                <div class="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
                  <div class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">${avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</p>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">${t("report.stats.avgRating")}</p>
                  </div>
                </div>
                <div class="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
                  <div class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">${report.competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0).toLocaleString()}</p>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">${t("report.stats.totalReviews")}</p>
                  </div>
                </div>
              </div>

              <hr class="border-gray-200" />

              <!-- SWOT Analysis -->
              ${swotMatch ? `
              <section>
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                  SWOT Analysis
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${Object.entries(swotData).map(([key, items]: [string, any]) => items.length ? `
                    <div class="bg-white rounded-lg border shadow-sm">
                      <div class="p-4 border-b">
                        <h4 class="text-sm font-medium capitalize flex items-center gap-2 ${key === 'strengths' ? 'text-green-600' :
        key === 'weaknesses' ? 'text-red-600' :
          key === 'opportunities' ? 'text-blue-600' : 'text-orange-600'
      }">
                          ${key}
                        </h4>
                      </div>
                      <div class="p-4">
                        <ul class="space-y-2">
                          ${items.map((item: string) => `
                            <li class="text-sm text-gray-600 flex items-start gap-2">
                              <span class="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${key === 'strengths' ? 'bg-green-600' :
          key === 'weaknesses' ? 'bg-red-600' :
            key === 'opportunities' ? 'bg-blue-600' : 'bg-orange-600'
        }"></span>
                              ${item}
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    </div>
                  ` : '').join('')}
                </div>
              </section>
              <hr class="border-gray-200" />
              ` : ''}

              <!-- Market Trends -->
              ${trendsMatch ? `
              <section>
                <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg overflow-hidden">
                  <div class="p-6 border-b border-indigo-100">
                    <h3 class="text-lg font-semibold flex items-center gap-2 text-indigo-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                      Market Trends
                    </h3>
                  </div>
                  <div class="p-6">
                    <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      ${trendsData.map((trend: string) => `
                        <li class="bg-white p-3 rounded-lg shadow-sm border text-sm flex items-start gap-2 text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500 shrink-0 mt-0.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                          ${trend}
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </section>
              <hr class="border-gray-200" />
              ` : ''}

              <!-- Target Audience -->
              ${targetAudienceMatch ? `
              <section>
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Target Audience Persona
                </h3>
                <div class="bg-white rounded-lg border shadow-sm p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${Object.entries(targetAudienceData).map(([key, items]: [string, any]) => `
                      <div>
                        <h4 class="font-medium text-sm text-gray-500 mb-2 uppercase tracking-wider">${key}</h4>
                        <ul class="space-y-2">
                          ${items.map((item: string) => `
                            <li class="text-sm flex items-start gap-2 text-gray-700">
                              <span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                              ${item}
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </section>
              <hr class="border-gray-200" />
              ` : ''}

              <!-- Marketing Strategy -->
              ${marketingMatch ? `
              <section>
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
                  Marketing Strategy
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  ${Object.entries(marketingData).map(([key, items]: [string, any]) => `
                    <div class="bg-blue-50/50 border border-blue-100 rounded-lg overflow-hidden">
                      <div class="p-4 border-b border-blue-100">
                        <h4 class="text-sm font-medium text-blue-700 uppercase tracking-wider">
                          ${key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                      </div>
                      <div class="p-4">
                        <ul class="space-y-2">
                          ${items.map((item: string) => `
                            <li class="text-sm flex items-start gap-2 text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                              ${item}
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </section>
              <hr class="border-gray-200" />
              ` : ''}

              <!-- AI Analysis -->
              <section>
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-xl font-bold flex items-center gap-2 text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                    ${t("report.sections.aiAnalysis")}
                  </h3>
                </div>
                <div class="border-2 border-blue-100 rounded-lg shadow-sm bg-gradient-to-br from-blue-50/50 via-white to-white p-6 prose max-w-none">
                  ${mainContent}
                </div>
              </section>

              <hr class="border-gray-200" />

              <!-- Competitors -->
              <section>
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                  ${t("report.sections.nearbyCompetitors")} (${report.competitors.length})
                </h3>
                
                ${report.competitors.length === 0 ? `
                  <div class="bg-white rounded-lg border shadow-sm p-6 text-center text-gray-500">
                    ${t("report.sections.noCompetitors")}
                  </div>
                ` : `
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${report.competitors.map((competitor: any) => `
                      <div class="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div class="space-y-3">
                          <div class="space-y-2">
                            <div class="flex items-start justify-between gap-2">
                              <h4 class="font-medium text-sm leading-tight text-gray-900">${competitor.name}</h4>
                              ${competitor.rating ? `
                                <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-900"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                  ${competitor.rating.toFixed(1)}
                                </span>
                              ` : ''}
                            </div>
                            <p class="text-sm text-gray-500 flex items-start gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                              <span class="line-clamp-2">${competitor.address}</span>
                            </p>
                            ${competitor.userRatingsTotal ? `
                              <p class="text-xs text-gray-500 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                ${t("report.competitor.reviews", { count: competitor.userRatingsTotal.toLocaleString() })}
                              </p>
                            ` : ''}
                            <div class="flex flex-wrap gap-1">
                              ${competitor.distance ? `
                                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                  ${competitor.distance}
                                </span>
                              ` : ''}
                              ${competitor.priceLevel ? `
                                <span class="inline-flex items-center gap-0.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                  ${competitor.priceLevel}
                                </span>
                              ` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </section>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
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

                  {report && (
                    <PDFDownloadLink
                      document={<PDFReport report={report} t={t} />}
                      fileName={`report-${report.businessName.toLowerCase().replace(/\s+/g, "-")}.pdf`}
                      style={{ textDecoration: 'none' }}
                    >
                      {({ loading, error }) => {
                        if (error) console.error("PDF Generation Error:", error);
                        return (
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            disabled={loading}
                            data-testid="button-download-pdf"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            {loading ? "Generating PDF..." : (error ? "Error Generating PDF" : t("report.view.printPdf"))}
                          </DropdownMenuItem>
                        )
                      }}
                    </PDFDownloadLink>
                  )}

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
                  {t("report.sections.aiPoweredInsights")}
                </Badge>
              </div>

              <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
                <CardContent className="p-0" data-testid="text-ai-analysis">
                  <AIAnalysisContent html={mainContent} />
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

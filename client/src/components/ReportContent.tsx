import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Users, Lightbulb, TrendingUp, TrendingDown, Target, Megaphone, MessageSquare, Globe, ArrowUpRight, CheckCircle2, XCircle, AlertTriangle, Building2, DollarSign, Brain } from "lucide-react";
import { AIAnalysisContent } from "@/components/AIAnalysisContent";
import { CompetitorMap } from "./CompetitorMap";
import type { Report, Competitor, Business } from "@shared/schema";
import { useState } from "react";

// Types
interface ReportContentProps {
    report: Report;
    business: Business | undefined;
    isGuest?: boolean;
}

// Sub-components (copied from ReportView)
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

function SwotSection({ title, items, icon: Icon, color }: { title: string, items: string[], icon: any, color: 'green' | 'red' | 'blue' | 'orange' }) {
    if (!items.length) return null;

    const colorStyles = {
        green: {
            text: "text-green-600 dark:text-green-400",
            bg: "bg-green-600 dark:bg-green-400"
        },
        red: {
            text: "text-red-600 dark:text-red-400",
            bg: "bg-red-600 dark:bg-red-400"
        },
        blue: {
            text: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-600 dark:bg-blue-400"
        },
        orange: {
            text: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-600 dark:bg-orange-400"
        }
    };

    const styles = colorStyles[color];

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${styles.text}`}>
                    <Icon className="h-4 w-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${styles.bg}`} />
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

export function ReportContent({ report, business, isGuest = false }: ReportContentProps) {
    const { t } = useTranslation();

    // Parse fields
    const swot = report.swotAnalysis as any;
    const trends = (report.marketTrends as string[]) || [];
    const targetAudience = report.targetAudience as any;
    const marketingStrategy = report.marketingStrategy as any;
    const sentiment = report.customerSentiment as any;

    return (
        <div className="space-y-8 print:space-y-4">
            {/* Executive Summary */}
            {report.executiveSummary && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <Lightbulb className="h-5 w-5" />
                        <h3 className="font-semibold text-lg">{t("report.sections.executiveSummary")}</h3>
                    </div>
                    <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                        <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground font-medium">
                            {report.executiveSummary}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Competitor Analysis */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">{t("report.sections.competitorLook")}</h3>
                </div>

                {/* Competitor Map */}
                <div className="h-[300px] w-full rounded-lg overflow-hidden border shadow-sm">
                    <CompetitorMap
                        center={{ lat: business?.latitude || 0, lng: business?.longitude || 0 }}
                        competitors={report.competitors}
                        businessName={business?.name || report.businessName}
                    />
                </div>

                {/* Competitor Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {report.competitors.length > 0 ? (
                        report.competitors.map((competitor, i) => (
                            <CompetitorCard key={i} competitor={competitor} index={i} t={t} />
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm col-span-full italic">No competitors found in this area.</p>
                    )}
                </div>
            </section>

            {/* SWOT Analysis */}
            {swot && (
                <section className="space-y-3 print:break-inside-avoid">
                    <div className="flex items-center gap-2 text-primary">
                        <Target className="h-5 w-5" />
                        <h3 className="font-semibold text-lg">{t("report.sections.swot")}</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SwotSection
                            title={t("report.swot.strengths")}
                            items={swot.strengths || []}
                            icon={CheckCircle2}
                            color="green"
                        />
                        <SwotSection
                            title={t("report.swot.weaknesses")}
                            items={swot.weaknesses || []}
                            icon={XCircle}
                            color="red"
                        />
                        <SwotSection
                            title={t("report.swot.opportunities")}
                            items={swot.opportunities || []}
                            icon={Lightbulb}
                            color="blue"
                        />
                        <SwotSection
                            title={t("report.swot.threats")}
                            items={swot.threats || []}
                            icon={AlertTriangle}
                            color="orange"
                        />
                    </div>
                </section>
            )}

            {/* Market Trends */}
            {trends.length > 0 && (
                <section className="space-y-3 print:break-inside-avoid">
                    <MarketTrends trends={trends} />
                </section>
            )}

            {/* Target Audience */}
            {targetAudience && (
                <section className="space-y-3 print:break-inside-avoid">
                    <div className="flex items-center gap-2 text-primary">
                        <Users className="h-5 w-5" />
                        <h3 className="font-semibold text-lg">{t("report.sections.targetAudience")}</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t("report.audience.demographics")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    <p><span className="font-medium text-foreground">Age:</span> {targetAudience.demographics?.ageRange}</p>
                                    <p><span className="font-medium text-foreground">Gender:</span> {targetAudience.demographics?.gender}</p>
                                    <p><span className="font-medium text-foreground">Income:</span> {targetAudience.demographics?.incomeLevel}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t("report.audience.painPoints")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc leading-relaxed pl-4 space-y-1 text-sm text-muted-foreground">
                                    {Array.isArray(targetAudience.painPoints) && targetAudience.painPoints.map((point: string, i: number) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Marketing Strategy */}
            {marketingStrategy && (
                <section className="space-y-3 print:break-inside-avoid">
                    <div className="flex items-center gap-2 text-primary">
                        <Megaphone className="h-5 w-5" />
                        <h3 className="font-semibold text-lg">{t("report.sections.marketingStrategy")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Channels</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(marketingStrategy.channels) && marketingStrategy.channels.map((channel: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200">
                                            {channel}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Tactics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                                    {Array.isArray(marketingStrategy.tactics) && marketingStrategy.tactics.map((tactic: string, i: number) => (
                                        <li key={i}>{tactic}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Customer Sentiment */}
            {sentiment && (
                <section className="space-y-3 print:break-inside-avoid">
                    <div className="flex items-center gap-2 text-primary">
                        <MessageSquare className="h-5 w-5" />
                        <h3 className="font-semibold text-lg">{t("report.sections.customerSentiment")}</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">{t("report.sentiment.praises")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                                    {sentiment.commonPraises?.map((item: string, i: number) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">{t("report.sentiment.complaints")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                                    {sentiment.recurringComplaints?.map((item: string, i: number) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{t("report.sentiment.unmetNeeds")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                                    {sentiment.unmetNeeds?.map((item: string, i: number) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Detailed AI Analysis */}
            <section className="space-y-3 print:break-inside-avoid">
                <div className="flex items-center gap-2 text-primary">
                    <Brain className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">{t("report.sections.detailedAnalysis")}</h3>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <AIAnalysisContent html={report.html || report.aiAnalysis} />
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Users, Star, Lock, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Competitor {
    name: string;
    address: string;
    rating?: number;
    userRatingsTotal?: number;
    priceLevel?: string;
}

interface PreviewReportProps {
    competitors: Competitor[];
    totalFound: number;
    aiInsights: string;
    location: {
        address: string;
        latitude: number;
        longitude: number;
    };
    radius: number;
    onCreateAccount: () => void;
}

export default function PreviewReport({
    competitors,
    totalFound,
    aiInsights,
    location,
    radius,
    onCreateAccount,
}: PreviewReportProps) {
    const { t } = useTranslation();
    const hiddenCount = totalFound - competitors.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
                                {t("previewReport.title")}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{location.address}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{radius}m radius</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {t("previewReport.competitorsFound", { count: totalFound })}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalFound}</div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Rating</span>
                            </div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {competitors.filter(c => c.rating).length > 0
                                    ? (competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length).toFixed(1)
                                    : 'N/A'}
                            </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {t("previewReport.showingPreview", { count: competitors.length })}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{competitors.length}</div>
                        </div>
                    </div>
                </div>

                {/* Competitors Preview */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nearby Competitors</h2>

                    <div className="space-y-4">
                        {competitors.map((competitor, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{competitor.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{competitor.address}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            {competitor.rating && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="font-medium">{competitor.rating.toFixed(1)}</span>
                                                    {competitor.userRatingsTotal && (
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            ({competitor.userRatingsTotal} reviews)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {competitor.priceLevel && (
                                                <span className="text-gray-600 dark:text-gray-400">{competitor.priceLevel}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Locked Competitors */}
                        {hiddenCount > 0 && (
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-gray-900 z-10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <div className="text-center">
                                        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                            {t("previewReport.moreCompetitors", { count: hiddenCount })}
                                        </p>
                                    </div>
                                </div>
                                <div className="blur-sm pointer-events-none opacity-50">
                                    {[...Array(Math.min(3, hiddenCount))].map((_, i) => (
                                        <div
                                            key={i}
                                            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mb-4"
                                        >
                                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Insights Preview */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {t("previewReport.aiPreview")}
                    </h2>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded-r-xl relative">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiInsights}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-50 dark:from-blue-900/20 to-transparent flex items-end justify-center pb-2">
                            <Lock className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Upgrade CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold mb-2">{t("previewReport.unlockFull")}</h2>
                        <p className="text-blue-100">Get complete access to all features</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">{t("previewReport.benefits.allCompetitors", { count: totalFound })}</p>
                                <p className="text-sm text-blue-100">Complete competitor list with full details</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">{t("previewReport.benefits.fullAnalysis")}</p>
                                <p className="text-sm text-blue-100">In-depth AI-powered market insights</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">{t("previewReport.benefits.export")}</p>
                                <p className="text-sm text-blue-100">Download reports as PDF or HTML</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm">✓</span>
                            </div>
                            <div>
                                <p className="font-semibold">{t("previewReport.benefits.saveTrack")}</p>
                                <p className="text-sm text-blue-100">Monitor changes over time</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={onCreateAccount}
                        className="w-full h-14 bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg rounded-xl shadow-lg"
                    >
                        {t("previewReport.createAccount")} - It's Free!
                    </Button>

                    <p className="text-center text-sm text-blue-100 mt-4">
                        No credit card required • Instant access • Cancel anytime
                    </p>
                </div>
            </div>
        </div>
    );
}

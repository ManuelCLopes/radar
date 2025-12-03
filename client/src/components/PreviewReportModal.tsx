import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, TrendingUp, Users, Star, Lock, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Competitor {
    name: string;
    address: string;
    rating?: number;
    userRatingsTotal?: number;
    priceLevel?: string;
}

interface PreviewReportModalProps {
    open: boolean;
    onClose: () => void;
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

export function PreviewReportModal({
    open,
    onClose,
    competitors,
    totalFound,
    aiInsights,
    location,
    radius,
    onCreateAccount,
}: PreviewReportModalProps) {
    const { t } = useTranslation();
    const hiddenCount = totalFound - competitors.length;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[85vh] p-0 gap-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        {t("previewReport.title")}
                    </DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{location.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{radius}m {t("previewReport.radius")}</span>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(85vh-80px)]">
                    <div className="p-6 pt-0">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {t("previewReport.avgRating")}
                                    </span>
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

                        {/* Competitors Preview */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {t("previewReport.nearbyCompetitors")}
                            </h3>

                            <div className="space-y-3">
                                {competitors.map((competitor, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{competitor.name}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{competitor.address}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    {competitor.rating && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            <span className="font-medium">{competitor.rating.toFixed(1)}</span>
                                                            {competitor.userRatingsTotal && (
                                                                <span className="text-gray-500 dark:text-gray-400">
                                                                    ({competitor.userRatingsTotal} {t("previewReport.reviews")})
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
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-gray-900/80 dark:to-gray-900 z-10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <div className="text-center">
                                                <Lock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                                    {t("previewReport.moreCompetitors", { count: hiddenCount })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="blur-sm pointer-events-none opacity-40">
                                            {[...Array(Math.min(2, hiddenCount))].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mb-3"
                                                >
                                                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
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
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {t("previewReport.aiPreview")}
                            </h3>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded-r-xl relative">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiInsights}</p>
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50 dark:from-blue-900/20 to-transparent flex items-end justify-center pb-2">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Upgrade CTA */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-6 text-white">
                            <div className="text-center mb-4">
                                <h3 className="text-2xl font-bold mb-1">{t("previewReport.unlockFull")}</h3>
                                <p className="text-blue-100 text-sm">{t("previewReport.getCompleteAccess")}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3 mb-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs">✓</span>
                                    </div>
                                    <span>{t("previewReport.benefits.allCompetitors", { count: totalFound })}</span>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs">✓</span>
                                    </div>
                                    <span>{t("previewReport.benefits.fullAnalysis")}</span>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs">✓</span>
                                    </div>
                                    <span>{t("previewReport.benefits.export")}</span>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs">✓</span>
                                    </div>
                                    <span>{t("previewReport.benefits.saveTrack")}</span>
                                </div>
                            </div>

                            <Button
                                onClick={onCreateAccount}
                                className="w-full h-12 bg-white text-blue-600 hover:bg-gray-100 font-bold text-base rounded-lg shadow-lg"
                            >
                                {t("previewReport.createAccount")}
                            </Button>

                            <p className="text-center text-xs text-blue-100 mt-3">
                                {t("previewReport.noCreditCard")}
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

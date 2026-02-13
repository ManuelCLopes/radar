import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileText, X, Mail } from "lucide-react";
import type { Report } from "@shared/schema";

interface ReportNotificationProps {
    report: Report | null;
    onViewReport: (report: Report) => void;
    onDismiss: () => void;
}

export function ReportNotification({ report, onViewReport, onDismiss }: ReportNotificationProps) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (report) {
            // Animate in
            const enterTimer = setTimeout(() => setIsVisible(true), 50);
            // Auto-dismiss after 15s
            const dismissTimer = setTimeout(() => handleDismiss(), 15000);
            return () => {
                clearTimeout(enterTimer);
                clearTimeout(dismissTimer);
            };
        } else {
            setIsVisible(false);
        }
    }, [report]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsExiting(false);
            setIsVisible(false);
            onDismiss();
        }, 300);
    };

    const handleView = () => {
        if (report) {
            onViewReport(report);
            handleDismiss();
        }
    };

    if (!report || (!isVisible && !isExiting)) return null;

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] w-[360px] max-w-[calc(100vw-48px)] transition-all duration-300 ease-out ${isVisible && !isExiting
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-4 opacity-0 scale-95"
                }`}
        >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                {/* Success accent bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
                                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-foreground">
                                    {t("reportNotification.title")}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {report.businessName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-muted/50 rounded-lg px-3 py-2">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>{t("reportNotification.emailSent")}</span>
                    </div>

                    {/* Action */}
                    <Button
                        onClick={handleView}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {t("reportNotification.viewReport")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

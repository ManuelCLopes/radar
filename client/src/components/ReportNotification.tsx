import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
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
            // Auto-dismiss after 10s (reduced from 15s)
            const dismissTimer = setTimeout(() => handleDismiss(), 10000);
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
            className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 ease-out ${isVisible && !isExiting
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-95"
                }`}
        >
            <div className="bg-background text-foreground border border-border/50 rounded-lg shadow-xl overflow-hidden flex items-center p-4 gap-4 max-w-sm">
                <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                    <FileText className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-none">
                        {t("reportNotification.title")}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 truncate opacity-90">
                        {report.businessName}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        onClick={handleView}
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                    >
                        {t("reportNotification.viewReport")}
                    </Button>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-md hover:bg-white/20 dark:hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

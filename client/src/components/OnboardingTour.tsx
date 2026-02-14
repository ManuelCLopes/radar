import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Rocket } from "lucide-react";

interface TourStep {
    target: string; // data-tour attribute selector
    titleKey: string;
    descriptionKey: string;
    position: "bottom" | "top" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
    {
        target: "[data-tour='welcome']",
        titleKey: "onboarding.welcome.title",
        descriptionKey: "onboarding.welcome.description",
        position: "bottom",
    },
    {
        target: "[data-tour='add-business']",
        titleKey: "onboarding.addBusiness.title",
        descriptionKey: "onboarding.addBusiness.description",
        position: "bottom",
    },
    {
        target: "[data-tour='new-analysis']",
        titleKey: "onboarding.newAnalysis.title",
        descriptionKey: "onboarding.newAnalysis.description",
        position: "bottom",
    },
    {
        target: "[data-tour='history-tab']",
        titleKey: "onboarding.history.title",
        descriptionKey: "onboarding.history.description",
        position: "bottom",
    },
    {
        target: "[data-tour='settings']",
        titleKey: "onboarding.settings.title",
        descriptionKey: "onboarding.settings.description",
        position: "bottom",
    },
];

const STORAGE_KEY = "onboarding_completed";

interface OnboardingTourProps {
    isNewUser: boolean;
}

export function OnboardingTour({ isNewUser }: OnboardingTourProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
    const tooltipRef = useRef<HTMLDivElement>(null);

    const isActive = currentStep >= 0;

    // Check if tour should start
    useEffect(() => {
        if (!isNewUser) return;
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            // Delay start to let the dashboard render
            const timer = setTimeout(() => setCurrentStep(0), 800);
            return () => clearTimeout(timer);
        }
    }, [isNewUser]);

    const positionTooltip = useCallback(() => {
        if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return;

        const step = TOUR_STEPS[currentStep];
        const target = document.querySelector(step.target);
        const tooltip = tooltipRef.current;

        if (!target || !tooltip) return;

        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 12;

        // Spotlight style
        setSpotlightStyle({
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderRadius: "8px",
        });

        // Tooltip position based on step preference
        let top = 0;
        let left = 0;

        switch (step.position) {
            case "bottom":
                top = rect.bottom + padding;
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                break;
            case "top":
                top = rect.top - tooltipRect.height - padding;
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                break;
            case "left":
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                left = rect.left - tooltipRect.width - padding;
                break;
            case "right":
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                left = rect.right + padding;
                break;
        }

        // Clamp to viewport
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipRect.width - 16));
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipRect.height - 16));

        setTooltipStyle({ top, left });
    }, [currentStep]);

    useEffect(() => {
        if (!isActive) return;
        // Position after render
        const raf = requestAnimationFrame(positionTooltip);
        window.addEventListener("resize", positionTooltip);
        window.addEventListener("scroll", positionTooltip, true);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", positionTooltip);
            window.removeEventListener("scroll", positionTooltip, true);
        };
    }, [isActive, positionTooltip]);

    const completeTour = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setCurrentStep(-1);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep >= TOUR_STEPS.length - 1) {
            completeTour();
        } else {
            setCurrentStep((s) => s + 1);
        }
    }, [currentStep, completeTour]);

    const prevStep = useCallback(() => {
        setCurrentStep((s) => Math.max(0, s - 1));
    }, []);

    if (!isActive) return null;

    const step = TOUR_STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === TOUR_STEPS.length - 1;
    const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

    return (
        <>
            {/* Overlay backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300"
                onClick={completeTour}
            />

            {/* Spotlight cutout */}
            <div
                className="fixed z-[9999] ring-[9999px] ring-black/60 pointer-events-none transition-all duration-300 ease-out"
                style={spotlightStyle}
            />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="fixed z-[10000] w-[340px] max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={tooltipStyle}
            >
                <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                    <Rocket className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">
                                    {t(step.titleKey)}
                                </h3>
                            </div>
                            <button
                                onClick={completeTour}
                                className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                aria-label={t("onboarding.skip")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {t(step.descriptionKey)}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {currentStep + 1} / {TOUR_STEPS.length}
                            </span>
                            <div className="flex gap-2">
                                {!isFirst && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={prevStep}
                                        className="h-8 px-3"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        {t("onboarding.previous")}
                                    </Button>
                                )}
                                {isFirst && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={completeTour}
                                        className="h-8 px-3 text-muted-foreground"
                                    >
                                        {t("onboarding.skip")}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={nextStep}
                                    className="h-8 px-4"
                                >
                                    {isLast ? t("onboarding.finish") : t("onboarding.next")}
                                    {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

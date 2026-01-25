
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to create checkout session");
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const handleManage = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/create-portal-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to create portal session");
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{t('pricing.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-2xl">{t('pricing.free.title')}</CardTitle>
                            <CardDescription>{t('pricing.free.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold mb-6">{t('pricing.free.price')}</div>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.basicAnalysis')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.weeklyReport')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.oneBusiness')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.reportsLimit')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.standardSupport')}</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline" disabled={user?.plan === 'free'} onClick={() => onOpenChange(false)}>
                                {user?.plan === 'free' ? t('pricing.buttons.currentPlan') : t('pricing.buttons.downgrade')}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="flex flex-col border-primary relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm">
                            {t('pricing.pro.recommended')}
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">{t('pricing.pro.title')}</CardTitle>
                            <CardDescription>{t('pricing.pro.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-3xl font-bold mb-6">
                                <span className="line-through text-muted-foreground text-lg mr-2">{t('pricing.pro.originalPrice')}</span>
                                {t('pricing.pro.price')}
                                <span className="text-lg font-normal text-muted-foreground">{t('pricing.pro.period')}</span>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.basicAnalysis')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.weeklyReport')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.unlimitedBusinesses')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.advancedInsights')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.prioritySupport')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{t('pricing.features.exportPdf')}</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {user?.plan === 'pro' ? (
                                <Button className="w-full" onClick={handleManage} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('pricing.buttons.manage')}
                                </Button>
                            ) : (
                                <Button className="w-full" onClick={handleUpgrade} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('pricing.buttons.upgrade')}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

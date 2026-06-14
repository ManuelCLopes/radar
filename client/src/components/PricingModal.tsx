
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<"pro" | "agency" | null>(null);
    const [billingMode, setBillingMode] = useState<"waitlist" | "live">("waitlist");
    const [configuredPlans, setConfiguredPlans] = useState<Record<"pro" | "agency", boolean>>({
        pro: false,
        agency: false,
    });
    const [waitlistPlan, setWaitlistPlan] = useState<"pro" | "agency" | null>(null);
    const [waitlistEmail, setWaitlistEmail] = useState(user?.email || "");
    const [waitlistMessage, setWaitlistMessage] = useState("");

    useEffect(() => {
        if (user?.email) {
            setWaitlistEmail(user.email);
        }
    }, [user?.email]);

    useEffect(() => {
        if (!open) return;

        fetch("/api/stripe-config-status")
            .then((res) => res.json())
            .then((status) => {
                setBillingMode(status.billingMode === "live" ? "live" : "waitlist");
                setConfiguredPlans({
                    pro: Boolean(status.plans?.pro),
                    agency: Boolean(status.plans?.agency),
                });
            })
            .catch(() => {
                setBillingMode("waitlist");
                setConfiguredPlans({ pro: false, agency: false });
            });
    }, [open]);

    const handleUpgrade = async (plan: "pro" | "agency") => {
        if (billingMode !== "live" || !configuredPlans[plan]) {
            setWaitlistPlan(plan);
            return;
        }

        setIsLoading(true);
        setLoadingPlan(plan);
        try {
            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ plan }),
            });

            if (!res.ok) {
                throw new Error("Failed to create checkout session");
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setLoadingPlan(null);
        }
    };

    const handleJoinWaitlist = async () => {
        if (!waitlistPlan) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/billing-waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: waitlistEmail,
                    plan: waitlistPlan,
                    message: waitlistMessage,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error("Failed to join waitlist");
            }

            toast({
                title: result.alreadyJoined ? t("pricing.waitlist.alreadyJoinedTitle") : t("pricing.waitlist.successTitle"),
                description: result.alreadyJoined ? t("pricing.waitlist.alreadyJoinedDescription") : t("pricing.waitlist.successDescription"),
            });
            setWaitlistPlan(null);
            setWaitlistMessage("");
        } catch (error) {
            console.error(error);
            toast({
                title: t("pricing.waitlist.errorTitle"),
                description: t("pricing.waitlist.errorDescription"),
                variant: "destructive",
            });
        } finally {
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

    const isPaidPlan = user?.plan === "pro" || user?.plan === "agency";
    const canCheckout = (plan: "pro" | "agency") => billingMode === "live" && configuredPlans[plan];
    const plans = [
        {
            id: "free",
            title: t('pricing.free.title'),
            description: t('pricing.free.description'),
            price: t('pricing.free.price'),
            period: "",
            featured: false,
            features: [
                t('pricing.features.basicAnalysis'),
                t('pricing.features.oneBusiness'),
                t('pricing.features.reportsLimit'),
                t('pricing.features.freeRadius'),
                t('pricing.features.standardSupport'),
            ],
        },
        {
            id: "pro",
            title: t('pricing.pro.title'),
            description: t('pricing.pro.description'),
            price: t('pricing.pro.price'),
            period: t('pricing.pro.period'),
            featured: true,
            features: [
                t('pricing.features.proReports'),
                t('pricing.features.proBusinesses'),
                t('pricing.features.proRadius'),
                t('pricing.features.weeklyReport'),
                t('pricing.features.exportPdf'),
            ],
        },
        {
            id: "agency",
            title: t('pricing.agency.title'),
            description: t('pricing.agency.description'),
            price: t('pricing.agency.price'),
            period: t('pricing.agency.period'),
            featured: false,
            features: [
                t('pricing.features.agencyReports'),
                t('pricing.features.agencyBusinesses'),
                t('pricing.features.agencyRadius'),
                t('pricing.features.clientReports'),
                t('pricing.features.prioritySupport'),
            ],
        },
    ] as const;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{t('pricing.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={`flex flex-col relative overflow-hidden ${plan.featured ? "border-primary shadow-md" : ""}`}>
                            {plan.featured && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm">
                                    {t('pricing.pro.recommended')}
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.title}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-3xl font-bold mb-6">
                                    {plan.price}
                                    <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {plan.id === "free" ? (
                                    <Button className="w-full" variant="outline" disabled={!isPaidPlan} onClick={() => onOpenChange(false)}>
                                        {!isPaidPlan ? t('pricing.buttons.currentPlan') : t('pricing.buttons.manageToDowngrade')}
                                    </Button>
                                ) : user?.plan === plan.id ? (
                                    <Button className="w-full" onClick={handleManage} disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('pricing.buttons.manage')}
                                    </Button>
                                ) : (
                                    <Button className="w-full" onClick={() => handleUpgrade(plan.id)} disabled={isLoading}>
                                        {loadingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {canCheckout(plan.id)
                                            ? plan.id === "agency" ? t('pricing.buttons.upgradeAgency') : t('pricing.buttons.upgrade')
                                            : t('pricing.buttons.requestAccess')}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {waitlistPlan && (
                    <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">{t("pricing.waitlist.title")}</h2>
                            <p className="text-sm text-muted-foreground">
                                {t("pricing.waitlist.description", {
                                    plan: waitlistPlan === "agency" ? t("pricing.agency.title") : t("pricing.pro.title"),
                                })}
                            </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto] md:items-center">
                            <Input
                                type="email"
                                value={waitlistEmail}
                                onChange={(event) => setWaitlistEmail(event.target.value)}
                                placeholder={t("pricing.waitlist.emailPlaceholder")}
                            />
                            <Input
                                value={waitlistMessage}
                                onChange={(event) => setWaitlistMessage(event.target.value)}
                                placeholder={t("pricing.waitlist.messagePlaceholder")}
                            />
                            <Button onClick={handleJoinWaitlist} disabled={isLoading || !waitlistEmail}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("pricing.waitlist.submit")}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

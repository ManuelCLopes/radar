import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Mail, Lock, User, Sparkles, Check, CreditCard, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Step = "account" | "plan" | "payment";

const plans = [
    {
        id: "free",
        name: "Free",
        price: "€0",
        period: "/mês",
        features: ["1 negócio", "5 relatórios/mês", "Análise básica"],
    },
    {
        id: "pro",
        name: "Pro",
        price: "€29",
        period: "/mês",
        features: ["5 negócios", "Relatórios ilimitados", "Análise avançada", "Suporte prioritário"],
        popular: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "€99",
        period: "/mês",
        features: ["Negócios ilimitados", "Relatórios ilimitados", "API access", "Suporte dedicado"],
    },
];

export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState<Step>("account");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const registerSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().min(1, t("validation.required")).email(t("validation.emailInvalid")),
        password: z.string().min(6, t("validation.passwordMin", { min: 6 })),
        plan: z.string(),
        paymentMethod: z.string(),
    });

    type RegisterFormValues = z.infer<typeof registerSchema>;

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            plan: "pro",
            paymentMethod: "card",
        },
    });

    const handleAccountSubmit = async () => {
        const isValid = await form.trigger(["email", "password", "firstName", "lastName"]);
        if (isValid) {
            setError("");
            setCurrentStep("plan");
        }
    };

    const handleFinalSubmit = async () => {
        setError("");
        setLoading(true);
        const data = form.getValues();

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    firstName: data.firstName,
                    lastName: data.lastName,
                }),
            });

            if (response.ok) {
                setLocation("/dashboard");
            } else {
                const responseData = await response.json();
                setError(responseData.message || "Registration failed");
                setCurrentStep("account");
            }
        } catch (err) {
            setError(t("auth.errors.generic"));
            setCurrentStep("account");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const response = await fetch("/api/auth/google");
            if (!response.ok) {
                const data = await response.json();
                setError(data.message || "Google sign up is not available");
                return;
            }
            window.location.href = "/api/auth/google";
        } catch (err) {
            setError("Google sign up is not available. Please use email/password.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Theme and Language Toggle - Fixed position */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                <LanguageSelector />
                <ThemeToggle />
            </div>

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>

            <div className="w-full max-w-2xl px-4 relative z-10">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 space-y-6">
                    {/* Logo and Title */}
                    <div className="flex items-center justify-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                Radar Local
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("auth.createAccount")}
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2">
                        {[
                            { id: "account", label: t("auth.stepAccount") },
                            { id: "plan", label: t("auth.stepPlan") },
                            { id: "payment", label: t("auth.stepPayment") },
                        ].map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                    currentStep === step.id
                                        ? "bg-blue-600 text-white"
                                        : index < ["account", "plan", "payment"].indexOf(currentStep)
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                )}>
                                    {index < ["account", "plan", "payment"].indexOf(currentStep) ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <span className="w-4 h-4 flex items-center justify-center text-xs">{index + 1}</span>
                                    )}
                                    <span className="hidden sm:inline">{step.label}</span>
                                </div>
                                {index < 2 && (
                                    <div className={cn(
                                        "w-8 h-0.5 mx-1",
                                        index < ["account", "plan", "payment"].indexOf(currentStep)
                                            ? "bg-green-400 dark:bg-green-500"
                                            : "bg-gray-300 dark:bg-gray-700"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-lg">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <Form {...form}>
                        {/* Step 1: Account */}
                        {currentStep === "account" && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.firstName")}</FormLabel>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="John"
                                                                className="pl-9 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.lastName")}</FormLabel>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Doe"
                                                                className="pl-9 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.email")}</FormLabel>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            className="pl-10 h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.password")}</FormLabel>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="pl-10 h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t("auth.passwordMinChars")}</p>
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        onClick={handleAccountSubmit}
                                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                                    >
                                        {t("auth.continue")}
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-medium">
                                            {t("auth.orContinueWith")}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                                    onClick={handleGoogleSignup}
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {t("auth.continueWithGoogle")}
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Plan Selection */}
                        {currentStep === "plan" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">{t("auth.choosePlan")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {plans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => form.setValue("plan", plan.id)}
                                            className={cn(
                                                "relative p-4 rounded-xl border-2 transition-all text-left",
                                                form.watch("plan") === plan.id
                                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            )}
                                        >
                                            {plan.popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-full">
                                                    {t("auth.popular")}
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                                    <div className="flex items-baseline gap-1 mt-1">
                                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                                                    </div>
                                                </div>
                                                <ul className="space-y-2">
                                                    {plan.features.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                            <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep("account")}
                                        className="flex-1 h-12 rounded-xl border-gray-300 dark:border-gray-600"
                                    >
                                        {t("auth.back")}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep("payment")}
                                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {t("auth.continue")}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {currentStep === "payment" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">{t("auth.paymentMethod")}</h3>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => form.setValue("paymentMethod", "card")}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3",
                                            form.watch("paymentMethod") === "card"
                                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        )}
                                    >
                                        <CreditCard className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{t("auth.creditCard")}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{t("auth.creditCardDesc")}</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => form.setValue("paymentMethod", "mb")}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3",
                                            form.watch("paymentMethod") === "mb"
                                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                        )}
                                    >
                                        <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{t("auth.multibanco")}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{t("auth.multibancoDesc")}</div>
                                        </div>
                                    </button>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <strong>{t("auth.selectedPlan")}:</strong> {plans.find(p => p.id === form.watch("plan"))?.name} - {plans.find(p => p.id === form.watch("plan"))?.price}{t("auth.perMonth")}
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep("plan")}
                                        className="flex-1 h-12 rounded-xl border-gray-300 dark:border-gray-600"
                                    >
                                        {t("auth.back")}
                                    </Button>
                                    <Button
                                        onClick={handleFinalSubmit}
                                        disabled={loading}
                                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                {t("auth.creatingAccount")}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                {t("auth.signUp")}
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>

                    {/* Footer */}
                    {currentStep === "account" && (
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("auth.haveAccount")}{" "}
                                <a
                                    href="/login"
                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                    {t("auth.login")}
                                </a>
                            </p>
                        </div>
                    )}
                </div>

                {/* Back to home link */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        {t("auth.backToHome")}
                    </a>
                </div>
            </div>
        </div>
    );
}

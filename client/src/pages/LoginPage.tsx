import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/hooks/useAuth";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { t } = useTranslation();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const loginSchema = z.object({
        email: z.string().min(1, t("validation.required")).email(t("validation.emailInvalid")),
        password: z.string().min(1, t("validation.required")),
    });

    type LoginFormValues = z.infer<typeof loginSchema>;

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const { loginMutation } = useAuth();

    const onSubmit = async (data: LoginFormValues) => {
        setError("");
        setLoading(true);

        try {
            await loginMutation.mutateAsync(data);

            // Check for pending report from landing page
            const pendingReportJson = sessionStorage.getItem('pending_report');
            if (pendingReportJson) {
                try {
                    const report = JSON.parse(pendingReportJson);

                    // Save the report directly without creating a business
                    await fetch(`/api/reports/save-existing`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            businessId: null,
                            report: report
                        })
                    });
                } catch (e) {
                    console.error("Failed to save pending report:", e);
                } finally {
                    sessionStorage.removeItem('pending_report');
                }
            }

            setLocation("/dashboard");
        } catch (err: any) {
            // Error handling is now partly in mutation, but we can keep local error state for UI
            const message = err.message || "An error occurred";

            if (message.includes("Invalid credentials") || message.includes("401")) {
                setError(t("auth.errors.invalidCredentials"));
            } else if (message.includes("Google login required")) {
                setError(t("auth.errors.useGoogle"));
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "/api/auth/google";
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

            <div className="w-full max-w-md px-4 relative z-10">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 space-y-6">
                    {/* Logo and Title */}
                    <div className="text-center space-y-4">
                        <Link href="/" className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt="Competitive Watcher" className="h-16 w-auto object-contain dark:invert-0 invert" />
                        </Link>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                {t("auth.login")}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-lg">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                    </FormItem>
                                )}
                            />

                            {/* Forgot Password Link */}
                            <div className="text-right">
                                <a
                                    href="/forgot-password"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                    Esqueceu a password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {t("auth.loggingIn")}
                                    </div>
                                ) : (
                                    t("auth.login")
                                )}
                            </Button>
                        </form>
                    </Form>

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
                        onClick={handleGoogleLogin}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {t("auth.continueWithGoogle")}
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("auth.noAccount")}{" "}
                            <a
                                href="/register"
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                            >
                                {t("auth.signUp")}
                                <Sparkles className="w-3 h-3" />
                            </a>
                        </p>
                    </div>
                </div>

                {/* Back to home link */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        ← Voltar à página inicial
                    </a>
                </div>
            </div>
        </div>
    );
}

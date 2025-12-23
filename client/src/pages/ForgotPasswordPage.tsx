import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await apiRequest("POST", "/api/auth/forgot-password", { email });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("auth.errors.generic"));
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || t("auth.errors.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center cursor-pointer transition-opacity hover:opacity-80">
                        <img src="/logo.png" alt="Competitor Watcher" className="h-10 w-auto" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageSelector />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20">
                <div className="w-full max-w-md space-y-6">
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold">{t("auth.forgotPasswordTitle")}</CardTitle>
                            <CardDescription>
                                {t("auth.forgotPasswordDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isSuccess ? (
                                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <AlertDescription className="text-green-800 dark:text-green-200">
                                        {t("auth.resetSuccess")}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t("auth.email")}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="h-12 rounded-xl"
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-medium rounded-xl"
                                        disabled={isLoading || !email}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("auth.sendingLink")}
                                            </>
                                        ) : (
                                            t("auth.sendResetLink")
                                        )}
                                    </Button>
                                </form>
                            )}

                            <div className="mt-6 text-center">
                                <Link href="/login" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                    {t("auth.backToLogin")}
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span>{t("auth.backToHome")}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

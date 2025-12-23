import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Eye, EyeOff, AlertCircle, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [, params] = useLocation() as any;
    const token = params?.split('/')[2];

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        if (!token) {
            setIsValid(false);
            setError(t("auth.invalidToken"));
            setIsValidating(false);
            return;
        }

        try {
            const response = await fetch(`/api/auth/verify-reset-token/${token}`);
            const data = await response.json();

            if (data.valid) {
                setIsValid(true);
            } else {
                setIsValid(false);
                setError(data.error || t("auth.invalidToken"));
            }
        } catch (err: any) {
            setIsValid(false);
            setError(t("auth.errors.generic"));
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError(t("auth.passwordMismatch"));
            return;
        }

        if (newPassword.length < 8) {
            setError(t("validation.passwordMin", { min: 8 }));
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiRequest("POST", "/api/auth/reset-password", {
                token,
                newPassword,
            });

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
                            <CardTitle className="text-2xl font-bold">{t("auth.resetPasswordTitle")}</CardTitle>
                            <CardDescription>
                                {t("auth.resetPasswordDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isValidating ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm text-gray-500">{t("auth.validatingToken")}</p>
                                </div>
                            ) : !isValid ? (
                                <div className="space-y-4">
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                    <div className="text-center">
                                        <Link href="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                            {t("auth.requestNewLink")}
                                        </Link>
                                    </div>
                                </div>
                            ) : isSuccess ? (
                                <div className="space-y-4">
                                    <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <AlertDescription className="text-green-800 dark:text-green-200">
                                            {t("auth.resetComplete")}
                                        </AlertDescription>
                                    </Alert>
                                    <Link href="/login">
                                        <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl">
                                            {t("auth.goToLogin")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                                className="pr-10 h-12 rounded-xl"
                                                autoFocus
                                            />
                                            <span
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                                className="pr-10 h-12 rounded-xl"
                                            />
                                            <span
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </span>
                                        </div>
                                    </div>

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-medium rounded-xl"
                                        disabled={isLoading || !newPassword || !confirmPassword}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("auth.resetting")}
                                            </>
                                        ) : (
                                            t("auth.resetPasswordTitle")
                                        )}
                                    </Button>
                                </form>
                            )}
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

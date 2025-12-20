import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [, params] = useLocation() as any;
    const token = params?.split('/')[2]; // Extract token from /reset-password/:token

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
            setError("Token inválido");
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
                setError(data.error || "Token inválido ou expirado");
            }
        } catch (err: any) {
            setIsValid(false);
            setError("Erro ao validar token");
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("As passwords não coincidem");
            return;
        }

        if (newPassword.length < 8) {
            setError("A password deve ter pelo menos 8 caracteres");
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
                throw new Error(data.error || "Failed to reset password");
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Erro ao redefinir password. Por favor tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <Link href="/" className="flex items-center cursor-pointer transition-opacity hover:opacity-80">
                        <img src="/logo.png" alt="Competitive Watcher" className="h-10 w-auto dark:invert-0 invert" />
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Redefinir Password</CardTitle>
                        <CardDescription>
                            Escolha uma nova password para a sua conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isValidating ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : !isValid ? (
                            <div className="space-y-4">
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                                <div className="text-center">
                                    <Link href="/forgot-password" className="text-primary hover:underline">
                                        Solicitar novo link
                                    </Link>
                                </div>
                            </div>
                        ) : isSuccess ? (
                            <div className="space-y-4">
                                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <AlertDescription className="text-green-800 dark:text-green-200">
                                        Password redefinida com sucesso! Pode agora fazer login com a sua nova password.
                                    </AlertDescription>
                                </Alert>
                                <Link href="/login">
                                    <Button className="w-full">Ir para Login</Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nova Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="pr-10"
                                            autoFocus
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="pr-10"
                                        />
                                        <span
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
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
                                    className="w-full"
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            A redefinir...
                                        </>
                                    ) : (
                                        "Redefinir Password"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

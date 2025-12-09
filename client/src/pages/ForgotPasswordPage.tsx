import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

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
                throw new Error(data.error || "Failed to send reset email");
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer transition-opacity hover:opacity-80">
                        <BarChart3 className="h-6 w-6" />
                        <span>Radar</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Recuperar Password</CardTitle>
                        <CardDescription>
                            Introduza o seu email e enviaremos um link para redefinir a sua password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSuccess ? (
                            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    Se existe uma conta com este email, receberá um link de recuperação em breve.
                                    Por favor verifique também a pasta de spam.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
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
                                    className="w-full"
                                    disabled={isLoading || !email}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            A enviar...
                                        </>
                                    ) : (
                                        "Enviar Link de Recuperação"
                                    )}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center text-sm">
                            <Link href="/login" className="text-primary hover:underline">
                                Voltar para Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

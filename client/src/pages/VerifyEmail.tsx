import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function VerifyEmail() {
    const [_, setLocation] = useLocation();
    // Parse query params manually since wouter doesn't have a hook for it yet
    const getSearchParams = () => new URLSearchParams(window.location.search);
    const token = getSearchParams().get("token");
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState(t("verifyEmail.verifyingMessage"));

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage(t("verifyEmail.invalidToken"));
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(t("verifyEmail.successMessage"));
                    // Refresh user session if logged in
                    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                } else {
                    setStatus("error");
                    setMessage(data.error || t("verifyEmail.errorMessage"));
                }
            } catch (error) {
                setStatus("error");
                setMessage(t("verifyEmail.connectionError"));
            }
        };

        verify();
    }, [token, queryClient, t]);

    const handleLogin = () => setLocation("/login");
    const handleDashboard = () => setLocation("/dashboard");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                        {status === "success" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                        {status === "error" && <XCircle className="h-6 w-6 text-red-600" />}
                    </div>
                    <CardTitle>{t("verifyEmail.title")}</CardTitle>
                    <CardDescription>
                        {status === "loading" && t("verifyEmail.loadingDescription")}
                        {status === "success" && t("verifyEmail.successDescription")}
                        {status === "error" && t("verifyEmail.errorDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-gray-600">{message}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    {status === "success" ? (
                        <Button onClick={handleDashboard} className="w-full">{t("verifyEmail.dashboard")}</Button>
                    ) : status === "error" ? (
                        <Button variant="outline" onClick={handleLogin} className="w-full">{t("verifyEmail.login")}</Button>
                    ) : null}
                </CardFooter>
            </Card>
        </div>
    );
}

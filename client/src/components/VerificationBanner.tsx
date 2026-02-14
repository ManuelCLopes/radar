import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function VerificationBanner() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // If user is not logged in or is already verified, don't show banner
    if (!user || user.isVerified) {
        return null;
    }

    const handleResend = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
            });

            if (res.ok) {
                toast({
                    title: t("common.emailSentTitle"),
                    description: t("common.emailSentDesc"),
                });
            } else {
                const data = await res.json();
                toast({
                    title: t("common.errorSendingEmail"),
                    description: data.error || t("common.connectionErrorDesc"),
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: t("common.connectionError"),
                description: t("common.connectionErrorDesc"),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-yellow-50 p-4 border-b border-yellow-200">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div className="text-sm text-yellow-800">
                        <span className="font-semibold">{t("common.verifyYourEmail")}</span> {t("common.featuresLimited")}
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-900 whitespace-nowrap"
                >
                    {isLoading ? t("common.sending") : (
                        <>
                            <Send className="mr-2 h-3 w-3" /> {t("common.resendEmail")}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

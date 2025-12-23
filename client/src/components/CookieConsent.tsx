import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie-consent", "declined");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
                        <Cookie className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-grow text-center md:text-left">
                        <p className="text-gray-700 dark:text-gray-200 text-sm md:text-base leading-relaxed">
                            {t("cookies.banner")} {" "}
                            <Link href="/cookie-policy" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                {t("cookies.learnMore")}
                            </Link>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleDecline}
                            className="flex-1 md:flex-none"
                        >
                            {t("cookies.decline")}
                        </Button>
                        <Button
                            onClick={handleAccept}
                            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {t("cookies.accept")}
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="hidden md:block p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

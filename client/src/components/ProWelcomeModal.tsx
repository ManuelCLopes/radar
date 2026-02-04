import { useTranslation } from "react-i18next";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProWelcomeModalProps {
    open: boolean;
    onClose: () => void;
}

export function ProWelcomeModal({ open, onClose }: ProWelcomeModalProps) {
    const { t } = useTranslation();

    const features = [
        {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            title: t("pro.welcome.feature1.title"),
            description: t("pro.welcome.feature1.description"),
        },
        {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            title: t("pro.welcome.feature2.title"),
            description: t("pro.welcome.feature2.description"),
        },
        {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            title: t("pro.welcome.feature3.title"),
            description: t("pro.welcome.feature3.description"),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {t("pro.welcome.title")}
                            </DialogTitle>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>
                    </div>
                    <DialogDescription className="text-base">
                        {t("pro.welcome.subtitle")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900"
                        >
                            <div className="mt-0.5">{feature.icon}</div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                        {t("pro.welcome.cta")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

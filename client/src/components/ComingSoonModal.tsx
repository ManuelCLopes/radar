import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ComingSoonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComingSoonModal({ open, onOpenChange }: ComingSoonModalProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState(user?.email || "");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user?.email]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/billing-waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    message,
                    plan: "pro",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to join waitlist");
            }

            toast({
                title: t("pricing.waitlist.successTitle"),
                description: t("pricing.waitlist.successDescription"),
            });
            setMessage("");
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({
                title: t("pricing.waitlist.errorTitle"),
                description: t("pricing.waitlist.errorDescription"),
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <DialogTitle>{t('pro.comingSoon.title')}</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">
                            {t('pro.comingSoon.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            {t('pro.comingSoon.footer')}
                        </p>
                        <Input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={t("pricing.waitlist.emailPlaceholder")}
                            required
                        />
                        <Textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder={t("pricing.waitlist.messagePlaceholder")}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('pro.comingSoon.gotIt')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !email}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("pricing.waitlist.submit")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

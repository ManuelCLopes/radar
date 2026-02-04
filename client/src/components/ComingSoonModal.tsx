import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ComingSoonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComingSoonModal({ open, onOpenChange }: ComingSoonModalProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
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
                <div className="py-4 text-sm text-muted-foreground">
                    {t('pro.comingSoon.footer')}
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        {t('pro.comingSoon.gotIt')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

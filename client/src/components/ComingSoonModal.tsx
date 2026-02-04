import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ComingSoonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComingSoonModal({ open, onOpenChange }: ComingSoonModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Coming Soon</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        We are currently finalizing the details of our Pro plan to ensure it delivers the best value for your business.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground">
                    At this moment, the Pro plan is not yet available for subscription. We appreciate your interest and are working hard to launch it soon!
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        Got it
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

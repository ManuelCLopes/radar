import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PricingModal } from '@/components/PricingModal';
import { ComingSoonModal } from '@/components/ComingSoonModal';

interface PricingModalContextType {
    openPricing: () => void;
    closePricing: () => void;
    isPricingOpen: boolean;
}

const PricingModalContext = createContext<PricingModalContextType | undefined>(undefined);

export function PricingModalProvider({ children }: { children: ReactNode }) {
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
    const [isStripeConfigured, setIsStripeConfigured] = useState(true); // Default to true to avoid flash if check fails/delays

    useEffect(() => {
        fetch('/api/stripe-config-status')
            .then(res => res.json())
            .then(data => {
                setIsStripeConfigured(data.configured);
            })
            .catch(err => console.error('Failed to check stripe config', err));
    }, []);

    const openPricing = () => {
        if (!isStripeConfigured) {
            setIsComingSoonOpen(true);
        } else {
            setIsPricingOpen(true);
        }
    };

    const closePricing = () => {
        setIsPricingOpen(false);
        setIsComingSoonOpen(false);
    };

    return (
        <PricingModalContext.Provider value={{ openPricing, closePricing, isPricingOpen }}>
            {children}
            <PricingModal open={isPricingOpen} onOpenChange={setIsPricingOpen} />
            <ComingSoonModal open={isComingSoonOpen} onOpenChange={setIsComingSoonOpen} />
        </PricingModalContext.Provider>
    );
}

export function usePricingModal() {
    const context = useContext(PricingModalContext);
    if (context === undefined) {
        throw new Error('usePricingModal must be used within a PricingModalProvider');
    }
    return context;
}

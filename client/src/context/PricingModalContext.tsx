
import { createContext, useContext, useState, ReactNode } from 'react';
import { PricingModal } from '@/components/PricingModal';

interface PricingModalContextType {
    openPricing: () => void;
    closePricing: () => void;
    isPricingOpen: boolean;
}

const PricingModalContext = createContext<PricingModalContextType | undefined>(undefined);

export function PricingModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openPricing = () => setIsOpen(true);
    const closePricing = () => setIsOpen(false);

    return (
        <PricingModalContext.Provider value={{ openPricing, closePricing, isPricingOpen: isOpen }}>
            {children}
            <PricingModal open={isOpen} onOpenChange={setIsOpen} />
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

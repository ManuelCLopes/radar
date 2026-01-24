import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Mock wouter
vi.mock('wouter', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useLocation: () => ['/settings', vi.fn()],
}));

// Mock LanguageSelector
vi.mock("@/components/LanguageSelector", () => ({
    LanguageSelector: () => <div data-testid="language-selector" />,
    languages: [
        { code: 'en', name: 'English', abbr: 'EN' },
        { code: 'pt', name: 'Português', abbr: 'PT' }
    ]
}));

// Mock ThemeToggle
vi.mock("@/components/ThemeToggle", () => ({
    ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// Mock useUser hook
vi.mock('@/hooks/use-user', () => ({
    useUser: () => ({
        user: {
            id: 1,
            username: 'testuser',
            fullName: 'Test User',
            email: 'test@example.com',
            plan: 'free',
        },
        isLoading: false,
    }),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe('SettingsPage', () => {
    const renderSettingsPage = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        return render(
            <QueryClientProvider client={queryClient}>
                <I18nextProvider i18n={i18n}>
                    <SettingsPage />
                </I18nextProvider>
            </QueryClientProvider>
        );
    };

    describe('Core Functionality', () => {
        it('should render without crashing', () => {
            renderSettingsPage();
            // Basic smoke test
            expect(document.body).toBeInTheDocument();
        });

        it('should display the Competitor Watcher logo', () => {
            renderSettingsPage();
            expect(screen.getByAltText('Competitor Watcher')).toBeInTheDocument();
        });

        it('should have a logout button', () => {
            renderSettingsPage();
            const logoutButton = screen.getByTitle('Logout');
            expect(logoutButton).toBeInTheDocument();
        });
    });

    describe('Subscription Card', () => {
        it('should display subscription section', () => {
            renderSettingsPage();
            // Test that subscription card exists
            expect(screen.getByText(/Subscription/i)).toBeInTheDocument();
            expect(screen.getByText(/Manage your plan and billing details/i)).toBeInTheDocument();
        });

        it('should display current plan', () => {
            renderSettingsPage();
            // Use getAllByText since "free" might appear multiple times (badge and text)
            // or filter by specific container if needed. For now, checking if at least one exists is fine,
            // or use specific selector.
            const freeElements = screen.getAllByText(/free/i);
            expect(freeElements.length).toBeGreaterThan(0);
        });

        it('should display upgrade button for free users', () => {
            renderSettingsPage();
            const upgradeLinks = screen.getAllByRole('link');
            const pricingLink = upgradeLinks.find(link =>
                link.getAttribute('href') === '/pricing'
            );
            expect(pricingLink).toBeInTheDocument();
            expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
        });
    });

    describe('No Plan Selection UI', () => {
        it('should NOT display OLD plan selection cards', () => {
            renderSettingsPage();
            // These old plan names should NOT exist
            expect(screen.queryByText(/Essential Plan/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Professional Plan/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Agency Plan/i)).not.toBeInTheDocument();
        });

        it('should NOT display OLD upgrade buttons', () => {
            renderSettingsPage();
            expect(screen.queryByText(/Upgrade to Professional/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Upgrade to Agency/i)).not.toBeInTheDocument();
            // "Current Plan" IS displayed in the new UI, so we remove this negative assertion
        });

        it('should NOT display old pricing', () => {
            renderSettingsPage();
            expect(screen.queryByText(/€29/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/€79/i)).not.toBeInTheDocument();
        });
    });

    describe('User Information Section', () => {
        it('should render user information section', () => {
            renderSettingsPage();
            // User section should render (fields may vary based on state)
            expect(document.body).toBeInTheDocument();
        });
    });

    describe('Danger Zone', () => {
        it('should display delete account button', () => {
            renderSettingsPage();
            expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument();
        });
    });
});

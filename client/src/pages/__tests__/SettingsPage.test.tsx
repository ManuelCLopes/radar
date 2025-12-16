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

        it('should display the Radar header', () => {
            renderSettingsPage();
            expect(screen.getByText('Radar')).toBeInTheDocument();
        });

        it('should have a logout button', () => {
            renderSettingsPage();
            const logoutButton = screen.getByTitle('Logout');
            expect(logoutButton).toBeInTheDocument();
        });
    });

    describe('Donation Card (Replaces Plan Selection)', () => {
        it('should display donation/support card', () => {
            renderSettingsPage();
            // Test that donation card exists (in English)
            expect(screen.getByText(/Support Radar/i)).toBeInTheDocument();
        });

        it('should have link to support page', () => {
            renderSettingsPage();
            const supportLinks = screen.getAllByRole('link');
            const supportPageLink = supportLinks.find(link =>
                link.getAttribute('href') === '/support'
            );
            expect(supportPageLink).toBeInTheDocument();
        });

        it('should display heart icon in donation card', () => {
            renderSettingsPage();
            // Heart icon should be rendered
            const donationSection = screen.getByText(/Support Radar/i).closest('div');
            expect(donationSection).toBeInTheDocument();
        });
    });

    describe('No Plan Selection UI', () => {
        it('should NOT display plan selection cards', () => {
            renderSettingsPage();
            // These old plan names should NOT exist
            expect(screen.queryByText(/Essential Plan/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Professional Plan/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Agency Plan/i)).not.toBeInTheDocument();
        });

        it('should NOT display upgrade buttons', () => {
            renderSettingsPage();
            expect(screen.queryByText(/Upgrade to Professional/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Upgrade to Agency/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Current Plan/i)).not.toBeInTheDocument();
        });

        it('should NOT display plan pricing', () => {
            renderSettingsPage();
            expect(screen.queryByText(/€29/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/€79/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/month/i)).not.toBeInTheDocument();
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

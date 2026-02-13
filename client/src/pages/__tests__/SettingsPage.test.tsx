import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import * as queryClientModule from '@/lib/queryClient';

// Mock react-i18next
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: "en",
            changeLanguage: vi.fn(),
        },
    }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Mock wouter
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useLocation: () => ['/settings', mockSetLocation],
}));

// Mock Pricing Context
const mockOpenPricing = vi.fn();
vi.mock("@/context/PricingModalContext", () => ({
    usePricingModal: () => ({ openPricing: mockOpenPricing, closePricing: vi.fn(), isPricingOpen: false }),
    PricingModalProvider: ({ children }: any) => <div>{children}</div>
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

// Mock useUser hook with a mutable implementation
const mockUser = {
    id: 1,
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    plan: 'free',
    subscriptionStatus: 'active'
};

const mockUseUser = vi.fn(() => ({
    user: mockUser,
    isLoading: false,
    logoutMutation: { mutate: vi.fn() }
}));

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => mockUseUser(),
}));
// Check if the component uses useAuth (from context) or useUser (hook)
// The file viewed used `import { useAuth } from "@/hooks/useAuth";`
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => mockUseUser(),
}));


// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

// Mock apiRequest
vi.mock("@/lib/queryClient", async () => {
    const actual = await vi.importActual("@/lib/queryClient");
    return {
        ...actual,
        apiRequest: vi.fn(),
    };
});

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
                <SettingsPage />
            </QueryClientProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUser.mockReturnValue({
            user: { ...mockUser },
            isLoading: false,
            logoutMutation: { mutate: vi.fn() }
        });
        // Reset fetch mock
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('Core Functionality', () => {
        it('should render without crashing', () => {
            renderSettingsPage();
            expect(screen.getByText('settings.title')).toBeInTheDocument();
        });

        it('should have a logout button', () => {
            renderSettingsPage();
            const logoutButton = screen.getByTitle('Logout');
            expect(logoutButton).toBeInTheDocument();
        });
    });

    describe('Subscription Section', () => {
        it('should trigger pricing modal when upgrading from free plan', async () => {
            renderSettingsPage();
            const upgradeButton = screen.getByRole('button', { name: "settings.subscription.upgrade" });

            await userEvent.click(upgradeButton);

            expect(mockOpenPricing).toHaveBeenCalled();
        });

        it('should show manage button for pro users', () => {
            mockUseUser.mockReturnValue({
                user: { ...mockUser, plan: 'pro' },
                isLoading: false,
                logoutMutation: { mutate: vi.fn() }
            });

            renderSettingsPage();
            expect(screen.getByText("settings.subscription.manage")).toBeInTheDocument();
        });

        it('should call portal session endpoint when managing pro subscription', async () => {
            mockUseUser.mockReturnValue({
                user: { ...mockUser, plan: 'pro' },
                isLoading: false,
                logoutMutation: { mutate: vi.fn() }
            });

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ url: 'http://stripe.portal' })
            });
            global.fetch = mockFetch;

            // Assign window.location.href mock
            Object.defineProperty(window, 'location', {
                value: { href: '' },
                writable: true
            });

            renderSettingsPage();

            const manageButton = screen.getByText("settings.subscription.manage");
            await userEvent.click(manageButton);

            expect(mockFetch).toHaveBeenCalledWith("/api/create-portal-session", expect.objectContaining({
                method: "POST"
            }));

            await waitFor(() => {
                expect(window.location.href).toBe('http://stripe.portal');
            });
        });
    });

    describe('Account Management', () => {
        it('should allow editing profile (UI only)', async () => {
            renderSettingsPage();
            const editButton = screen.getByText("settings.account.edit");
            await userEvent.click(editButton);

            const nameInput = screen.getByLabelText("settings.account.name");
            expect(nameInput).toBeEnabled();

            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, "New Name");

            const saveButton = screen.getByText("settings.account.save");
            await userEvent.click(saveButton);

            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: "settings.toast.profileUpdated.title"
            }));
        });

        it('should handle delete account flow', async () => {
            renderSettingsPage();

            // Click initial delete button
            const deleteButton = screen.getByText("settings.danger.button");
            await userEvent.click(deleteButton);

            // Dialog should appear
            expect(screen.getByText("settings.danger.dialog.title")).toBeInTheDocument();

            // Confirm deletion
            const confirmButton = screen.getByText("settings.danger.dialog.confirm");
            await userEvent.click(confirmButton);

            expect(queryClientModule.apiRequest).toHaveBeenCalledWith("DELETE", "/api/user");

            await waitFor(() => {
                expect(mockSetLocation).toHaveBeenCalledWith("/");
            });
        });

        it('should handle delete account error', async () => {
            (queryClientModule.apiRequest as any).mockRejectedValue(new Error("Failed"));

            renderSettingsPage();

            const deleteButton = screen.getByText("settings.danger.button");
            await userEvent.click(deleteButton);

            const confirmButton = screen.getByText("settings.danger.dialog.confirm");
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                    variant: "destructive"
                }));
            });
        });
    });
});


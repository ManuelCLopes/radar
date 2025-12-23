import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";

// Mock hooks
vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        loginMutation: {
            mutateAsync: vi.fn().mockResolvedValue({}),
        },
    }),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    }),
}));

// Mock ThemeToggle and LanguageSelector
vi.mock("@/components/ThemeToggle", () => ({
    ThemeToggle: () => <div data-testid="theme-toggle" />,
}));
vi.mock("@/components/LanguageSelector", () => ({
    LanguageSelector: () => <div data-testid="language-selector" />,
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe("LoginPage", () => {
    it("renders login form", () => {
        render(
            <QueryClientProvider client={queryClient}>
                <LoginPage />
            </QueryClientProvider>
        );

        expect(screen.getAllByAltText("Competitor Watcher")[0]).toBeInTheDocument();
        expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "auth.login" })).toBeInTheDocument();
    });

    it("validates required fields", async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <LoginPage />
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "auth.login" }));

        await waitFor(() => {
            // Check for validation messages (mocked translation keys)
            expect(screen.getAllByText("validation.required")).toHaveLength(2);
        });
    });
    it("saves pending report after login", async () => {
        // Mock sessionStorage
        const mockReport = {
            businessName: "Test Business",
            type: "restaurant",
            address: "Test Address",
            latitude: 10,
            longitude: 20,
            competitors: [],
            aiAnalysis: "Test Analysis"
        };

        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
        getItemSpy.mockReturnValue(JSON.stringify(mockReport));

        const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

        // Mock fetch for report saving only
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "report-123" })
            } as any); // Save report response

        render(
            <QueryClientProvider client={queryClient}>
                <LoginPage />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText("auth.email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText("auth.password"), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: "auth.login" }));

        await waitFor(() => {
            // Should NOT create business
            expect(global.fetch).not.toHaveBeenCalledWith('/api/businesses', expect.anything());

            // Should save report directly
            expect(global.fetch).toHaveBeenCalledWith('/api/reports/save-existing', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"businessId":null')
            }));
            expect(removeItemSpy).toHaveBeenCalledWith('pending_report');
        });

        getItemSpy.mockRestore();
        removeItemSpy.mockRestore();
    });
});

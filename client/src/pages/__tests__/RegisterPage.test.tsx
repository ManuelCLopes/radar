import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../RegisterPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
const mockMutateAsync = vi.fn().mockResolvedValue({});

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        registerMutation: {
            mutateAsync: mockMutateAsync,
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

describe("RegisterPage", () => {
    it("renders registration form", () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RegisterPage />
            </QueryClientProvider>
        );

        expect(screen.getByAltText("Competitor Watcher")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.firstName")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.lastName")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
    });

    it("shows 100% free badge", () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RegisterPage />
            </QueryClientProvider>
        );

        expect(screen.getByText(/auth.freeBadge/i)).toBeInTheDocument();
    });

    it("validates required fields", async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RegisterPage />
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "auth.signUp" }));

        await waitFor(() => {
            // Check for validation messages (mocked translation keys)
            expect(screen.getByText("validation.required")).toBeInTheDocument();
        });
    });

    it("submits registration on valid input", async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RegisterPage />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText("auth.firstName"), { target: { value: "Test" } });
        fireEvent.change(screen.getByLabelText("auth.lastName"), { target: { value: "User" } });
        fireEvent.change(screen.getByLabelText("auth.email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText("auth.password"), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: "auth.signUp" }));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
                firstName: "Test",
                lastName: "User",
                plan: "free", // All users are free now!
            });
        });
    });
    it("saves pending report after registration", async () => {
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
                <RegisterPage />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText("auth.firstName"), { target: { value: "Test" } });
        fireEvent.change(screen.getByLabelText("auth.lastName"), { target: { value: "User" } });
        fireEvent.change(screen.getByLabelText("auth.email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText("auth.password"), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: "auth.signUp" }));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
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

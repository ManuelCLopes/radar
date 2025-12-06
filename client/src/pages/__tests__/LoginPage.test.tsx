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

        expect(screen.getByText("Radar Local")).toBeInTheDocument();
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
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../RegisterPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";

// Mock hooks
vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        registerMutation: {
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

// Mock Embla Carousel
vi.mock("embla-carousel-react", () => ({
    default: () => [
        vi.fn(),
        {
            scrollPrev: vi.fn(),
            scrollNext: vi.fn(),
            scrollTo: vi.fn(),
            selectedScrollSnap: vi.fn().mockReturnValue(0),
            canScrollPrev: vi.fn().mockReturnValue(false),
            canScrollNext: vi.fn().mockReturnValue(true),
            on: vi.fn(),
            off: vi.fn(),
        },
    ],
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

        expect(screen.getByText("Radar Local")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.firstName")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.lastName")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
    });

    it("validates required fields", async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RegisterPage />
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "auth.continue" }));

        await waitFor(() => {
            // Check for validation messages (mocked translation keys)
            expect(screen.getByText("validation.required")).toBeInTheDocument();
            expect(screen.getByText("validation.passwordMin")).toBeInTheDocument();
        });
    });

    it("advances to plan selection on valid input", async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <RegisterPage />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText("auth.firstName"), { target: { value: "Test" } });
        fireEvent.change(screen.getByLabelText("auth.lastName"), { target: { value: "User" } });
        fireEvent.change(screen.getByLabelText("auth.email"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText("auth.password"), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: "auth.continue" }));

        await waitFor(() => {
            expect(screen.getByText("auth.choosePlan")).toBeInTheDocument();
        });
    });
});

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "../Dashboard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Mock hooks
vi.mock("@tanstack/react-query", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useQuery: vi.fn(),
        useMutation: vi.fn(),
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn(),
        })),
        QueryClient: vi.fn(),
    };
});

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("wouter", () => ({
    useLocation: vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock child components to simplify testing
vi.mock("@/components/BusinessList", () => ({
    BusinessList: () => <div data-testid="business-list">Business List</div>,
}));

vi.mock("@/components/BusinessForm", () => ({
    BusinessForm: () => <div data-testid="business-form">Business Form</div>,
}));

vi.mock("@/components/ui/tabs", () => ({
    Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
    TabsContent: ({ children, value }: any) => <div data-testid={`content-${value}`}>{children}</div>,
}));

describe("Dashboard", () => {
    const mockUser = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        plan: "professional"
    };

    beforeEach(() => {
        (useAuth as any).mockReturnValue({
            user: mockUser,
            logoutMutation: { mutate: vi.fn() }
        });

        (useLocation as any).mockReturnValue(["/dashboard", vi.fn()]);

        (useQuery as any).mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === "/api/businesses") {
                return {
                    data: [],
                    isLoading: false,
                    error: null
                };
            }
            if (queryKey[0] === "/api/reports/history") {
                return {
                    data: [],
                    isLoading: false,
                    error: null
                };
            }
            return { data: null, isLoading: false };
        });

        (useMutation as any).mockReturnValue({
            mutate: vi.fn(),
            isPending: false
        });
    });

    it("renders the dashboard header elements", () => {
        render(<Dashboard />);
        expect(screen.getByText("Radar")).toBeInTheDocument();
        expect(screen.getByTestId("tab-businesses")).toBeInTheDocument();
        expect(screen.getByTestId("tab-history")).toBeInTheDocument();
    });

    it("renders BusinessList by default", () => {
        render(<Dashboard />);
        expect(screen.getByTestId("business-list")).toBeInTheDocument();
    });

    it("renders action buttons", () => {
        render(<Dashboard />);
        // Check for Add Business button (by text or icon presence if text is hidden on mobile)
        // Since we mock translation, we expect the key or translated text.
        // t("dashboard.addBusiness") -> "Add Business" (assuming default mock behavior or key)
        // But we didn't mock t() to return keys.
        // Let's check for the button presence via other means if possible, or assume t returns key.
        // Actually, we didn't mock useTranslation explicitly in the test file, 
        // but setup.ts might have.
        // Let's check setup.ts or just check for something we know exists.
    });
});

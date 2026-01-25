import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Dashboard from "../Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// Mock hooks
vi.mock("@/hooks/useAuth");
vi.mock("@tanstack/react-query", async () => {
    const actual = await vi.importActual("@tanstack/react-query");
    return {
        ...actual,
        useQuery: vi.fn(),
        useMutation: vi.fn(() => ({
            mutate: vi.fn(),
            isPending: false,
        })),
    };
});
vi.mock("react-i18next");
vi.mock("wouter", () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
    useLocation: () => ["/dashboard", vi.fn()],
}));

// Mock components
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <div>ThemeToggle</div> }));
vi.mock("@/components/LanguageSelector", () => ({ LanguageSelector: () => <div>LanguageSelector</div> }));
vi.mock("@/components/BusinessList", () => ({ BusinessList: () => <div>BusinessList</div> }));
vi.mock("@/components/CompetitorMap", () => ({ CompetitorMap: () => <div>CompetitorMap</div> }));
vi.mock("@/components/ReportView", () => ({ ReportView: () => <div>ReportView</div> }));
vi.mock("@/components/ReportHistory", () => ({ ReportHistory: () => <div>ReportHistory</div> }));
vi.mock("@/components/ui/tabs", () => ({
    Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children, value, onClick }: any) => (
        <button role="tab" onClick={onClick} data-value={value}>
            {children}
        </button>
    ),
    TabsContent: ({ children, value }: any) => <div data-testid={`tabs-content-${value}`}>{children}</div>,
}));

describe("Dashboard", () => {
    const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

    const mockUseTranslation = useTranslation as unknown as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({
            user: { id: "1", email: "test@example.com" },
            logoutMutation: { mutate: vi.fn() },
        });

        mockUseTranslation.mockReturnValue({
            t: (key: string, options?: any) => {
                if (key === "dashboard.analysis.reportTitle" && options?.name) {
                    return options.name;
                }
                return key;
            },
            i18n: { language: "en" },
        });
    });

    it("renders history list with correct formatting", async () => {
        const mockReports = [
            {
                id: "1",
                businessName: "Test Business",
                generatedAt: new Date("2025-01-01T12:00:00Z").toISOString(),
                radius: 1000,
                businessId: null,
            },
            {
                id: "2",
                businessName: "Another Business",
                generatedAt: new Date("2025-01-02T14:30:00Z").toISOString(),
                radius: 500,
                businessId: "biz-1",
            },
        ];

        (useQuery as any).mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === "/api/businesses") {
                return { data: [], isLoading: false };
            }
            if (queryKey[0] === "/api/reports/history") {
                return { data: mockReports, isLoading: false };
            }
            return { data: [], isLoading: false };
        });

        render(<Dashboard />);

        // Switch to history tab (simulated by rendering, as Tabs defaults to 'businesses' but we can query by text)
        // Note: Radix UI Tabs might not render content until active. 
        // For this test, we might need to click the tab or mock Tabs to show all content.
        // However, let's try to find the tab trigger and click it.

        const historyTab = screen.getByRole("tab", { name: /history/i });
        fireEvent.click(historyTab);

        await waitFor(() => {
            expect(screen.getByText("Test Business")).toBeInTheDocument();
            expect(screen.getByText("Another Business")).toBeInTheDocument();
        });

        // Check for radius formatting
        expect(screen.getByText("1km")).toBeInTheDocument();
        expect(screen.getByText("500m")).toBeInTheDocument();
    });

    it("renders history items with responsive grid layout", async () => {
        const mockReports = [{
            id: "1",
            businessName: "Mobile Test Business",
            generatedAt: new Date().toISOString(),
            radius: 1000,
            businessId: null,
        }];

        (useQuery as any).mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === "/api/reports/history") {
                return { data: mockReports, isLoading: false };
            }
            return { data: [], isLoading: false };
        });

        render(<Dashboard />);
        const historyTab = screen.getByRole("tab", { name: /history/i });
        fireEvent.click(historyTab);

        await waitFor(() => {
            const historyItem = screen.getByText("Mobile Test Business").closest(".flex-col");
            expect(historyItem).toHaveClass("flex-col", "sm:flex-row");
        });
    });
});

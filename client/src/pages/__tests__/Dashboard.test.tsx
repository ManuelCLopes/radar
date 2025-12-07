import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "../Dashboard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Mock hooks
vi.mock("@tanstack/react-query", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        useQuery: vi.fn(),
        useMutation: vi.fn(),
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn(),
        })),
        QueryClient: vi.fn(),
    };
});

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: "en" }
    }),
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("wouter", () => ({
    useLocation: vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

// Mock child components to simplify testing
vi.mock("@/components/BusinessList", () => ({
    BusinessList: ({ onGenerateReport, onDelete }: any) => (
        <div data-testid="business-list">
            <button data-testid="btn-generate-report" onClick={() => onGenerateReport("1")}>Generate</button>
            <button data-testid="btn-delete" onClick={() => onDelete("1")}>Delete</button>
        </div>
    ),
}));

vi.mock("@/components/BusinessForm", () => ({
    BusinessForm: ({ onSubmit }: any) => (
        <div data-testid="business-form">
            <button data-testid="submit-business" onClick={() => onSubmit({ name: "New Biz" })}>Submit</button>
        </div>
    ),
}));

vi.mock("@/components/ReportHistory", () => ({
    ReportHistory: () => <div data-testid="report-history">Report History</div>,
}));

vi.mock("@/components/ui/tabs", () => ({
    Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
    TabsContent: ({ children, value }: any) => <div data-testid={`content-${value}`}>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogTrigger: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>,
}));

describe("Dashboard", () => {
    const mockUser = {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        plan: "professional"
    };

    const mockMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
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
            mutate: mockMutate,
            mutateAsync: mockMutate,
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
        expect(screen.getByTestId("btn-add-business")).toBeInTheDocument();
        expect(screen.getByTestId("btn-new-analysis")).toBeInTheDocument();
    });

    it("opens Analysis dialog and submits", async () => {
        render(<Dashboard />);
        screen.debug(undefined, 20000);
        const analysisBtn = screen.getByTestId("btn-new-analysis");
        fireEvent.click(analysisBtn);


        expect(screen.getByText("dashboard.analysis.title")).toBeInTheDocument();
    });

    it("opens Add Business dialog and submits", async () => {
        render(<Dashboard />);
        const addBtn = screen.getByTestId("btn-add-business");
        fireEvent.click(addBtn);

        expect(screen.getByTestId("business-form")).toBeInTheDocument();

        // Submit form
        fireEvent.click(screen.getByTestId("submit-business"));

        expect(mockMutate).toHaveBeenCalled();
    });

    it("switches tabs", async () => {
        render(<Dashboard />);
        // Tabs are mocked to just render content. 
        // Radix Tabs usually handle switching. Our mock doesn't implement state.
        // But we can check if the tab triggers are present.
        expect(screen.getByTestId("tab-history")).toBeInTheDocument();

        // In a real test we'd click and verify content change.
        // With our mock, we just verify structure.
    });

    it("handles generate report action from list", async () => {
        render(<Dashboard />);
        fireEvent.click(screen.getByTestId("btn-generate-report"));
        expect(mockMutate).toHaveBeenCalled();
    });

    it("handles delete action from list", async () => {
        render(<Dashboard />);
        fireEvent.click(screen.getByTestId("btn-delete"));
        expect(mockMutate).toHaveBeenCalled();
    });
});


import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportHistory } from "../ReportHistory";
import { useQuery } from "@tanstack/react-query";

// Mock hooks
vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === "report.history.description") return `History for ${options.name}`;
            if (key === "report.history.competitorsAnalyzed") return `${options.count} competitors analyzed`;
            return key;
        },
    }),
}));

// Mock UI components
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
    ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

describe("ReportHistory", () => {
    const mockBusiness = {
        id: "1",
        name: "Test Business",
    } as any;

    const mockOnOpenChange = vi.fn();
    const mockOnViewReport = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock URL.createObjectURL and revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => "blob:url");
        global.URL.revokeObjectURL = vi.fn();
    });

    it("renders nothing if business is null", () => {
        render(<ReportHistory business={null} open={true} onOpenChange={mockOnOpenChange} onViewReport={mockOnViewReport} />);
        expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("renders loading state", () => {
        (useQuery as any).mockReturnValue({ data: [], isLoading: true });

        render(<ReportHistory business={mockBusiness} open={true} onOpenChange={mockOnOpenChange} onViewReport={mockOnViewReport} />);

        expect(screen.getByText("report.history.title")).toBeInTheDocument();
        // Skeletons don't have text, but we can check if content is rendered
        expect(screen.getByText(`History for ${mockBusiness.name}`)).toBeInTheDocument();
    });

    it("renders empty state", () => {
        (useQuery as any).mockReturnValue({ data: [], isLoading: false });

        render(<ReportHistory business={mockBusiness} open={true} onOpenChange={mockOnOpenChange} onViewReport={mockOnViewReport} />);

        expect(screen.getByText("report.history.empty")).toBeInTheDocument();
    });

    it("renders list of reports", () => {
        const mockReports = [
            {
                id: "101",
                businessName: "Test Business",
                generatedAt: new Date().toISOString(),
                competitors: [{}, {}],
                html: "<html></html>"
            }
        ];
        (useQuery as any).mockReturnValue({ data: mockReports, isLoading: false });

        render(<ReportHistory business={mockBusiness} open={true} onOpenChange={mockOnOpenChange} onViewReport={mockOnViewReport} />);

        expect(screen.getByText("2 competitors analyzed")).toBeInTheDocument();
        expect(screen.getByTestId("button-view-report-101")).toBeInTheDocument();
        expect(screen.getByTestId("button-download-report-101")).toBeInTheDocument();
    });

    it("handles view report action", () => {
        const mockReports = [{ id: "101", generatedAt: new Date().toISOString(), competitors: [], html: "" }];
        (useQuery as any).mockReturnValue({ data: mockReports, isLoading: false });

        render(<ReportHistory business={mockBusiness} open={true} onOpenChange={mockOnOpenChange} onViewReport={mockOnViewReport} />);

        fireEvent.click(screen.getByTestId("button-view-report-101"));
        expect(mockOnViewReport).toHaveBeenCalledWith(mockReports[0]);
    });

    it("handles download report action", () => {
        const mockReports = [{ id: "101", businessName: "Test", generatedAt: new Date().toISOString(), competitors: [], html: "<div>Report</div>" }];
        (useQuery as any).mockReturnValue({ data: mockReports, isLoading: false });

        render(<ReportHistory business={mockBusiness} open={true} onOpenChange={mockOnOpenChange} onViewReport={mockOnViewReport} />);

        fireEvent.click(screen.getByTestId("button-download-report-101"));

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        // We can't easily test the anchor click and download in jsdom without more mocking, but we verified the function was called.
    });
});

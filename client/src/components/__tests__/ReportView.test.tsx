import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReportView } from "../ReportView";
import { type Report } from "@shared/schema";

// Mock hooks
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === "report.competitor.reviews") return `${options.count} reviews`;
            return key;
        },
    }),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
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

vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
    DropdownMenuSeparator: () => <hr />,
}));

vi.mock("@react-pdf/renderer", () => ({
    PDFDownloadLink: ({ children }: any) => <div>{typeof children === 'function' ? children({ loading: false }) : children}</div>,
    Document: () => <div>Document</div>,
    Page: () => <div>Page</div>,
    Text: () => <div>Text</div>,
    View: () => <div>View</div>,
    StyleSheet: { create: () => ({}) },
    Font: { register: () => { } },
}));

// Mock URL
global.URL.createObjectURL = vi.fn(() => "blob:url");
global.URL.revokeObjectURL = vi.fn();

describe("ReportView", () => {
    const mockReport: Report = {
        id: "1",
        userId: "1",
        businessId: "1",
        businessName: "Test Business",
        competitors: [
            {
                name: "Comp 1",
                address: "Addr 1",
                rating: 4.5,
                userRatingsTotal: 100,
                reviews: [
                    {
                        text: "Great food",
                        originalText: "Comida boa",
                        author: "John",
                        rating: 5,
                        date: "2023-01-01"
                    }
                ]
            },
            { name: "Comp 2", address: "Addr 2", rating: 3.0 }
        ],
        aiAnalysis: `
          <p class="my-2">Main analysis content here.</p>
          <h3 class="text-base font-semibold mt-3 mb-2">Detailed Analysis</h3>
          <p class="my-2"><strong class="font-semibold">Bold text</strong> and <em>italic</em>.</p>
          <h3 class="text-base font-semibold mt-3 mb-2">SWOT Analysis</h3>
          <h4 class="text-sm font-semibold mt-2 mb-1">Strengths</h4>
          <ul class="list-disc list-inside space-y-1 my-2"><li>Strength 1</li></ul>
          <h3 class="text-base font-semibold mt-3 mb-2">Market Trends</h3>
          <ul class="list-disc list-inside space-y-1 my-2"><li>Trend 1</li></ul>
          <h3 class="text-base font-semibold mt-3 mb-2">Target Audience</h3>
          <ul class="list-disc list-inside space-y-1 my-2">
            <li><strong class="font-semibold">Demographics</strong>: Age 20-30</li>
            <li><strong class="font-semibold">Psychographics</strong>: Lifestyle</li>
            <li><strong class="font-semibold">Pain Points</strong>: Cost</li>
          </ul>
        `,
        html: "<div>Report HTML</div>",
        generatedAt: new Date()
    };

    it("renders nothing when closed", () => {
        render(<ReportView report={mockReport} open={false} onOpenChange={vi.fn()} />);
        expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("renders report details when open", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        expect(screen.getByText(/Test Business/)).toBeInTheDocument();
        expect(screen.getByText(/Comp 1/)).toBeInTheDocument();
        expect(screen.getByText(/Comp 2/)).toBeInTheDocument();

        // Check markdown rendering (headers and list items)
        expect(screen.getByText(/Strength 1/)).toBeInTheDocument(); // li
    });

    it("renders competitor ratings", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);
        expect(screen.getByText("4.5")).toBeInTheDocument();
        expect(screen.getByText("3.0")).toBeInTheDocument();
    });

    it("should render nothing if report is null", () => {
        const { container } = render(<ReportView report={null} open={true} onOpenChange={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("should render report content correctly", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        expect(screen.getByText("report.view.title")).toBeInTheDocument();
        expect(screen.getByText(/Test Business/)).toBeInTheDocument();
        expect(screen.getByText("Comp 1")).toBeInTheDocument();
        expect(screen.getByText("Strength 1")).toBeInTheDocument();
        expect(screen.getByText("Trend 1")).toBeInTheDocument();
        expect(screen.getByText(/Age 20-30/)).toBeInTheDocument();
        expect(screen.getByText(/Lifestyle/)).toBeInTheDocument();
        expect(screen.getByText("Main analysis content here.")).toBeInTheDocument();
    });

    it("should handle download HTML", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        const downloadBtn = screen.getByText("report.view.downloadHtml");
        fireEvent.click(downloadBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });




    it("should render print PDF button", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        expect(screen.getByTestId("button-download-pdf")).toBeInTheDocument();
        expect(screen.getByText("report.view.printPdf")).toBeInTheDocument();
    });

    it("should handle email report", () => {
        const windowOpenMock = vi.fn();
        window.open = windowOpenMock;

        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        const emailBtn = screen.getByText("report.view.emailReport");
        fireEvent.click(emailBtn);

        expect(windowOpenMock).toHaveBeenCalledWith(expect.stringContaining("mailto:"), "_blank");
    });

    it("should toggle review translation", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        expect(screen.getByText('"Great food"')).toBeInTheDocument();

        const toggleBtn = screen.getByText("Show Original");
        fireEvent.click(toggleBtn);

        expect(screen.getByText('"Comida boa"')).toBeInTheDocument();
        expect(screen.getByText("Show Translated")).toBeInTheDocument();
    });

    it("should render no competitors message when list is empty", () => {
        const reportWithNoCompetitors = { ...mockReport, competitors: [] };
        render(
            <ReportView
                report={reportWithNoCompetitors}
                open={true}
                onOpenChange={() => { }}
            />
        );

        expect(screen.getByText("report.sections.noCompetitors")).toBeInTheDocument();
    });

    it("should parse and render all SWOT sections", () => {
        const mockReportAdvanced = {
            ...mockReport,
            plan: "professional",
            aiAnalysis: `
          <h2 class="text-lg font-semibold mt-4 mb-2">SWOT ANALYSIS</h2>
          <h3 class="text-base font-semibold mt-3 mb-2">Strengths</h3>
          <ul class="list-disc list-inside space-y-1 my-2">
            <li>S1</li>
          </ul>
          <h3 class="text-base font-semibold mt-3 mb-2">Weaknesses</h3>
          <ul class="list-disc list-inside space-y-1 my-2">
            <li>W1</li>
          </ul>
          <h3 class="text-base font-semibold mt-3 mb-2">Opportunities</h3>
          <ul class="list-disc list-inside space-y-1 my-2">
            <li>O1</li>
          </ul>
          <h3 class="text-base font-semibold mt-3 mb-2">Threats</h3>
          <ul class="list-disc list-inside space-y-1 my-2">
            <li>T1</li>
          </ul>
        `
        };

        render(
            <ReportView
                report={mockReportAdvanced}
                open={true}
                onOpenChange={vi.fn()}
            />
        );

        expect(screen.getByText("S1")).toBeInTheDocument();
        expect(screen.getByText("W1")).toBeInTheDocument();
        expect(screen.getByText("O1")).toBeInTheDocument();
        expect(screen.getByText("T1")).toBeInTheDocument();
    });
});

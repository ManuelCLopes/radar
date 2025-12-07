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
    DropdownMenuItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    DropdownMenuSeparator: () => <hr />,
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
Main analysis content here.

### SWOT Analysis
#### Strengths
- Strength 1
#### Weaknesses
- Weakness 1
#### Opportunities
- Opportunity 1
#### Threats
- Threat 1

### Market Trends
- Trend 1

### Target Audience
- **Demographics**: [Age 20-30]
- **Psychographics**: Lifestyle
- **Pain Points**: Cost
- **Needs**: Quality

### Marketing Strategy
- **Primary Channels**: [Social Media]
- **Content Ideas**: Videos
- **Promotional Tactics**: Discounts

Main analysis content here.
### Detailed Analysis
**Bold text** and *italic*.
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
        expect(screen.getByText("Age 20-30")).toBeInTheDocument();
        expect(screen.getByText("Social Media")).toBeInTheDocument();
        expect(screen.getByText("Main analysis content here.")).toBeInTheDocument();
    });

    it("should handle download HTML", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        const downloadBtn = screen.getByText("report.view.downloadHtml");
        fireEvent.click(downloadBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it("should handle print PDF", () => {
        const windowOpenMock = vi.fn().mockReturnValue({
            document: {
                write: vi.fn(),
                close: vi.fn(),
            },
        });
        window.open = windowOpenMock;

        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);

        const printBtn = screen.getByText("report.view.printPdf");
        fireEvent.click(printBtn);

        expect(windowOpenMock).toHaveBeenCalled();
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
});

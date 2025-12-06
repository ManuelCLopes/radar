import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReportView } from "../ReportView";
import { type Report } from "@shared/schema";

// Mock hooks
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

// Mock child components
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

describe("ReportView", () => {
    const mockReport: Report = {
        id: "1",
        userId: "1",
        businessId: "1",
        businessName: "Test Business",
        competitors: [
            { name: "Comp 1", address: "Addr 1", rating: 4.5 },
            { name: "Comp 2", address: "Addr 2", rating: 3.0 }
        ],
        aiAnalysis: "# Unique Analysis Header\n\n- Unique Point 1\n- Unique Point 2",
        html: "<div>Report</div>",
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
        expect(screen.getByText(/Unique Analysis Header/)).toBeInTheDocument(); // h1
        expect(screen.getByText(/Unique Point 1/)).toBeInTheDocument(); // li
    });

    it("renders competitor ratings", () => {
        render(<ReportView report={mockReport} open={true} onOpenChange={vi.fn()} />);
        expect(screen.getByText("4.5")).toBeInTheDocument();
        expect(screen.getByText("3.0")).toBeInTheDocument();
    });
});

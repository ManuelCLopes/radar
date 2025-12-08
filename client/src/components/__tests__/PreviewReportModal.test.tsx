import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PreviewReportModal } from "../PreviewReportModal";

// Mock react-i18next
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => {
            if (params?.count !== undefined) return `${key} ${params.count}`;
            return key;
        },
    }),
}));

describe("PreviewReportModal", () => {
    const mockCompetitors = [
        {
            name: "Competitor 1",
            address: "123 Main St",
            rating: 4.5,
            userRatingsTotal: 100,
            priceLevel: "$$",
        },
        {
            name: "Competitor 2",
            address: "456 Oak Ave",
            rating: 4.2,
            userRatingsTotal: 50,
            priceLevel: "$",
        },
        {
            name: "Competitor 3",
            address: "789 Pine Rd",
            rating: 4.8,
            userRatingsTotal: 200,
        },
    ];

    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        competitors: mockCompetitors,
        totalFound: 10,
        aiInsights: "This is a preview of AI insights...",
        location: {
            address: "Test Location",
            latitude: 40.7128,
            longitude: -74.0060,
        },
        radius: 1000,
        onCreateAccount: vi.fn(),
    };

    it("should render when open", () => {
        render(<PreviewReportModal {...defaultProps} />);
        expect(screen.getByText("Test Location")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
        render(<PreviewReportModal {...defaultProps} open={false} />);
        expect(screen.queryByText("Test Location")).not.toBeInTheDocument();
    });

    it("should display competitor information", () => {
        render(<PreviewReportModal {...defaultProps} />);

        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
        expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });
    it("should show total competitors found", () => {
        render(<PreviewReportModal {...defaultProps} />);
        expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should call onCreateAccount when button clicked", async () => {
        const user = userEvent.setup();
        render(<PreviewReportModal {...defaultProps} />);

        const createAccountButton = screen.getByText("previewReport.createAccount");
        await user.click(createAccountButton);

        expect(defaultProps.onCreateAccount).toHaveBeenCalled();
    });

    it("should display all preview competitors", () => {
        render(<PreviewReportModal {...defaultProps} />);
        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
        expect(screen.getByText("Competitor 2")).toBeInTheDocument();
        expect(screen.getByText("Competitor 3")).toBeInTheDocument();
    });
});

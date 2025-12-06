
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PreviewReport from "../PreviewReport";
import { useTranslation } from "react-i18next";

// Mock translation hook
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === "previewReport.competitorsFound") return `${options.count} Competitors Found`;
            if (key === "previewReport.showingPreview") return `Showing ${options.count} Preview`;
            if (key === "previewReport.moreCompetitors") return `${options.count} More Competitors`;
            if (key === "previewReport.benefits.allCompetitors") return `All ${options.count} Competitors`;
            return key;
        },
    }),
}));

describe("PreviewReport", () => {
    const mockProps = {
        competitors: [
            {
                name: "Competitor 1",
                address: "Address 1",
                rating: 4.5,
                userRatingsTotal: 100,
                priceLevel: "$$",
            },
            {
                name: "Competitor 2",
                address: "Address 2",
                rating: 4.0,
                userRatingsTotal: 50,
                priceLevel: "$",
            },
        ],
        totalFound: 10,
        aiInsights: "These are some AI insights about the location.",
        location: {
            address: "Test Location Address",
            latitude: 10,
            longitude: 20,
        },
        radius: 1000,
        onCreateAccount: vi.fn(),
    };

    it("renders the report header with location and radius", () => {
        render(<PreviewReport {...mockProps} />);
        expect(screen.getByText("previewReport.title")).toBeInTheDocument();
        expect(screen.getByText("Test Location Address")).toBeInTheDocument();
        expect(screen.getByText("1000m radius")).toBeInTheDocument();
    });

    it("renders the stats correctly", () => {
        render(<PreviewReport {...mockProps} />);
        expect(screen.getByText("10 Competitors Found")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument(); // Total found count
        expect(screen.getByText("Avg. Rating")).toBeInTheDocument();
        expect(screen.getByText("4.3")).toBeInTheDocument(); // (4.5 + 4.0) / 2
        expect(screen.getByText("Showing 2 Preview")).toBeInTheDocument();
    });

    it("renders the list of competitors", () => {
        render(<PreviewReport {...mockProps} />);
        expect(screen.getByText("Competitor 1")).toBeInTheDocument();
        expect(screen.getByText("Address 1")).toBeInTheDocument();
        expect(screen.getByText("4.5")).toBeInTheDocument();
        expect(screen.getByText("$$")).toBeInTheDocument();

        expect(screen.getByText("Competitor 2")).toBeInTheDocument();
        expect(screen.getByText("Address 2")).toBeInTheDocument();
    });

    it("renders the locked competitors message", () => {
        render(<PreviewReport {...mockProps} />);
        // Hidden count = 10 - 2 = 8
        expect(screen.getByText("8 More Competitors")).toBeInTheDocument();
    });

    it("renders AI insights", () => {
        render(<PreviewReport {...mockProps} />);
        expect(screen.getByText("previewReport.aiPreview")).toBeInTheDocument();
        expect(screen.getByText("These are some AI insights about the location.")).toBeInTheDocument();
    });

    it("renders the upgrade CTA and handles click", () => {
        render(<PreviewReport {...mockProps} />);
        expect(screen.getByText("previewReport.unlockFull")).toBeInTheDocument();
        expect(screen.getByText("All 10 Competitors")).toBeInTheDocument();

        const button = screen.getByRole("button", { name: /previewReport.createAccount/i });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockProps.onCreateAccount).toHaveBeenCalledTimes(1);
    });
});

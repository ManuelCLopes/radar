import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReportView } from "../ReportView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Mock translation
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: "en" },
    }),
}));

// Mock PDF components since they might cause issues in jsdom environment or require specific setup
vi.mock("../PDFReport", () => ({
    PDFReport: () => <div>PDF Report Mock</div>
}));

vi.mock("@react-pdf/renderer", () => ({
    PDFDownloadLink: ({ children }: any) => <div>{children({ loading: false })}</div>,
    Document: () => null,
    Page: () => null,
    Text: () => null,
    View: () => null,
    StyleSheet: { create: () => ({}) },
    Image: () => null,
}));

// Setup QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            {children}
        </TooltipProvider>
    </QueryClientProvider>
);

const mockReportBase = {
    id: "rep-1",
    businessId: "bus-1",
    businessName: "Test Business",
    competitors: [],
    generatedAt: new Date().toISOString(),
    aiAnalysis: "Raw AI Content",
    html: null,
    userId: "user-1",
    radius: 1000,
};

describe("ReportView", () => {
    it("renders structured data sections correctly", () => {
        const structuredReport = {
            ...mockReportBase,
            executiveSummary: "This is the market overview.",
            swotAnalysis: {
                strengths: ["Strength 1", "Strength 2"],
                weaknesses: ["Weakness 1"],
                opportunities: ["Opportunity 1"],
                threats: ["Threat 1"]
            },
            marketTrends: ["Trend 1: Impact", "Trend 2: Impact"],
            targetAudience: {
                demographics: "Demographic narrative.",
                psychographics: "Psychographic narrative.",
                painPoints: "Pain points narrative."
            },
            marketingStrategy: {
                primaryChannels: "Channel narrative.",
                contentIdeas: "Content ideas narrative.",
                promotionalTactics: "Tactics narrative."
            },
            customerSentiment: {
                commonPraises: ["Common Praise 1"],
                recurringComplaints: [],
                unmetNeeds: []
            }
        };

        render(
            <Wrapper>
                <ReportView
                    report={structuredReport as any}
                    open={true}
                    onOpenChange={() => { }}
                />
            </Wrapper>
        );

        expect(screen.getByText("Strength 1")).toBeInTheDocument();
        expect(screen.getByText("Trend 1: Impact")).toBeInTheDocument();

        // Assert narrative text
        expect(screen.getByText("Demographic narrative.")).toBeInTheDocument();
        expect(screen.getByText("Channel narrative.")).toBeInTheDocument();

        expect(screen.getByText("Common Praise 1")).toBeInTheDocument();
    });

    it("renders legacy content correctly using regex fallback", () => {
        const legacyReport = {
            ...mockReportBase,
            swotAnalysis: null,
            marketTrends: null,
            // Simulate HTML content that matches the regex patterns in ReportView
            aiAnalysis: `
                <h2>SWOT Analysis</h2>
                <h3>Strengths</h3>
                <ul><li>Legacy Strength 1</li></ul>
                <h2>Market Trends</h2>
                <ul><li>Legacy Trend 1</li></ul>
            `
        };

        render(
            <Wrapper>
                <ReportView
                    report={legacyReport as any}
                    open={true}
                    onOpenChange={() => { }}
                />
            </Wrapper>
        );

        expect(screen.getByText("Legacy Strength 1")).toBeInTheDocument();
        expect(screen.getByText("Legacy Trend 1")).toBeInTheDocument();
    });

    it("handles empty data gracefully", () => {
        const emptyReport = {
            ...mockReportBase,
            swotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            marketTrends: [],
            // ... other empty fields
        };

        render(
            <Wrapper>
                <ReportView
                    report={emptyReport as any}
                    open={true}
                    onOpenChange={() => { }}
                />
            </Wrapper>
        );

        // Should render the main analysis section but not the specific sections if they are empty
        expect(screen.getByTestId("text-ai-analysis")).toBeInTheDocument();
        // Ensure specific sections are NOT present (searching by text often used in headers)
        expect(screen.queryByText("Strength 1")).not.toBeInTheDocument();
    });
});

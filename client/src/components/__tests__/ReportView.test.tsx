import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReportView } from "../ReportView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useAuth } from "@/hooks/useAuth";
import type { Business } from "@shared/schema";

// Mock translation
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            if (key === "businessTypes.restaurant") return "Restaurant";
            if (key === "report.view.typeAnalysis") return `${options?.type} Analysis`;
            return key;
        },
        i18n: { language: "en" },
    }),
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(),
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

const createQueryClient = (business: Business | null = null) =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                queryFn: async ({ queryKey }) => {
                    if (queryKey[0] === `/api/businesses/${mockReportBase.businessId}`) {
                        return business;
                    }
                    return null;
                },
            },
        },
    });

const Wrapper = ({
    children,
    business = null,
}: {
    children: React.ReactNode;
    business?: Business | null;
}) => (
    <QueryClientProvider client={createQueryClient(business)}>
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
    generatedAt: "2026-03-18T00:00:00.000Z",
    aiAnalysis: "Raw AI Content",
    html: null,
    userId: "user-1",
    radius: 1000,
};

describe("ReportView", () => {
    it("shows type-based title and location subtitle for guest reports without header metadata", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
            loginMutation: {} as any,
            logoutMutation: {} as any,
            registerMutation: {} as any,
        });

        const guestReport = {
            ...mockReportBase,
            businessId: null,
            businessName: "Praca das Palmeiras 115, 3500-392 Viseu, Portugal",
            businessType: "restaurant",
            businessAddress: "Praca das Palmeiras 115, 3500-392 Viseu, Portugal",
        };

        render(
            <Wrapper>
                <ReportView
                    report={guestReport as any}
                    open={true}
                    onOpenChange={() => { }}
                    isGuest={true}
                />
            </Wrapper>
        );

        expect(screen.getByTestId("report-title")).toHaveTextContent("Restaurant Analysis");
        expect(screen.getByText("Praca das Palmeiras 115, 3500-392 Viseu, Portugal")).toBeInTheDocument();
        expect(screen.queryByText(new Date(mockReportBase.generatedAt).toLocaleDateString())).not.toBeInTheDocument();
    });

    it("prefers persisted report header context over live business data", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
            loginMutation: {} as any,
            logoutMutation: {} as any,
            registerMutation: {} as any,
        });

        const report = {
            ...mockReportBase,
            businessType: "restaurant",
            businessAddress: "Historic Address, Viseu, Portugal",
        };

        const currentBusiness = {
            id: "bus-1",
            userId: "user-1",
            name: "Renamed Business",
            type: "cafe" as const,
            address: "New Address, Porto, Portugal",
            latitude: 0,
            longitude: 0,
            locationStatus: "validated" as const,
            rating: null,
            userRatingsTotal: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        render(
            <Wrapper business={currentBusiness}>
                <ReportView
                    report={report as any}
                    open={true}
                    onOpenChange={() => { }}
                />
            </Wrapper>
        );

        expect(screen.getByTestId("report-title")).toHaveTextContent("Restaurant Analysis");
        expect(screen.getByText("Historic Address, Viseu, Portugal")).toBeInTheDocument();
        expect(screen.queryByText("New Address, Porto, Portugal")).not.toBeInTheDocument();
    });

    it("renders structured data sections correctly", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
            loginMutation: {} as any,
            logoutMutation: {} as any,
            registerMutation: {} as any,
        });

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
                demographics: {
                    ageRange: "25-34",
                    gender: "All",
                    incomeLevel: "Medium"
                },
                psychographics: "Psychographic narrative.",
                painPoints: ["Pain points narrative."]
            },
            marketingStrategy: {
                channels: ["Channel 1"],
                tactics: ["Tactic 1"]
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

        // Assert narrative text (updated keys)
        expect(screen.getByText("25-34")).toBeInTheDocument();
        expect(screen.getByText("Channel 1")).toBeInTheDocument();
        expect(screen.getByText("Tactic 1")).toBeInTheDocument();

        expect(screen.getByText("Common Praise 1")).toBeInTheDocument();
    });

    // Legacy content test removed as we no longer support the regex fallback for raw HTML/JSON dumps

    it("handles empty data gracefully", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: undefined,
            isLoading: false,
            isAuthenticated: false,
            loginMutation: {} as any,
            logoutMutation: {} as any,
            registerMutation: {} as any,
        });

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

        // Should NOT render the main analysis section if executiveSummary is missing
        expect(screen.queryByText("report.sections.detailedAnalysis")).not.toBeInTheDocument();
        // Ensure specific sections are NOT present (searching by text often used in headers)
        expect(screen.queryByText("Strength 1")).not.toBeInTheDocument();
    });
});

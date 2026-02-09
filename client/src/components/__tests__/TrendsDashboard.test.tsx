import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrendsDashboard } from "../TrendsDashboard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePricingModal } from "@/context/PricingModalContext";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(() => ({ data: [], isLoading: false, error: null }))
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(() => ({ user: { plan: "pro" } }))
}));

vi.mock("@/context/PricingModalContext", () => ({
    usePricingModal: vi.fn(() => ({ openPricing: vi.fn() }))
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key
    })
}));

// Mock recharts to avoid SVG rendering issues
vi.mock("recharts", () => ({
    ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    Line: () => null
}));

describe("TrendsDashboard", () => {
    const mockBusiness = {
        id: "biz-1",
        name: "Test Business",
        type: "restaurant",
        address: "123 Test St",
        latitude: 40.7,
        longitude: -74.0,
        locationStatus: "validated" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "user-1",
        rating: 4.5,
        userRatingsTotal: 100
    };

    const mockOpenPricing = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (usePricingModal as any).mockReturnValue({ openPricing: mockOpenPricing });
    });

    describe("Non-Pro User", () => {
        beforeEach(() => {
            (useAuth as any).mockReturnValue({ user: { plan: "essential" } });
        });

        it("should show locked state for non-pro users", () => {
            render(<TrendsDashboard business={mockBusiness} />);

            expect(screen.getByText("Unlock Competitor Trends")).toBeInTheDocument();
            expect(screen.getByText("Unlock Pro Metrics")).toBeInTheDocument();
        });

        it("should open pricing modal when unlock button is clicked", () => {
            render(<TrendsDashboard business={mockBusiness} />);

            const unlockButton = screen.getByText("Unlock Pro Metrics");
            fireEvent.click(unlockButton);

            expect(mockOpenPricing).toHaveBeenCalled();
        });

        it("should show mock background cards", () => {
            render(<TrendsDashboard business={mockBusiness} />);

            expect(screen.getByText("Rating History")).toBeInTheDocument();
            expect(screen.getByText("Market Activity")).toBeInTheDocument();
        });
    });

    describe("Pro User", () => {
        beforeEach(() => {
            (useAuth as any).mockReturnValue({ user: { plan: "pro" } });
        });

        it("should show loading state", () => {
            (useQuery as any).mockReturnValue({ data: [], isLoading: true, error: null });

            render(<TrendsDashboard business={mockBusiness} />);

            expect(screen.getByText("Loading trends...")).toBeInTheDocument();
        });

        it("should show error state", () => {
            (useQuery as any).mockReturnValue({ data: [], isLoading: false, error: new Error("Failed") });

            render(<TrendsDashboard business={mockBusiness} />);

            expect(screen.getByText("Failed to load trends")).toBeInTheDocument();
        });

        it("should show empty state when no trends data", () => {
            (useQuery as any).mockReturnValue({ data: [], isLoading: false, error: null });

            render(<TrendsDashboard business={mockBusiness} />);

            expect(screen.getByText("No trend data yet")).toBeInTheDocument();
            expect(screen.getByText("Generate more reports over time to see trends appear here.")).toBeInTheDocument();
        });

        it("should render charts when trends data is available", () => {
            const mockTrends = [
                { id: "1", date: "2025-01-01", avgRating: 4.2, businessRating: 4.5, competitorCount: 5, minRating: 3.5, maxRating: 4.8 },
                { id: "2", date: "2025-01-15", avgRating: 4.3, businessRating: 4.6, competitorCount: 6, minRating: 3.6, maxRating: 4.9 }
            ];
            (useQuery as any).mockReturnValue({ data: mockTrends, isLoading: false, error: null });

            render(<TrendsDashboard business={mockBusiness} />);

            // Charts should render
            expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        });

        it("should display charts when trends data is available", () => {
            const mockTrends = [
                { id: "1", date: "2025-01-01", avgRating: 4.2, businessRating: 4.5, competitorCount: 5, minRating: 3.5, maxRating: 4.8 }
            ];
            (useQuery as any).mockReturnValue({ data: mockTrends, isLoading: false, error: null });

            render(<TrendsDashboard business={mockBusiness} />);

            // Both chart types should render
            expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
            expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        });
    });
});

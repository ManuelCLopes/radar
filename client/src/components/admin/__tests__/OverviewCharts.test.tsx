import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OverviewCharts } from "../OverviewCharts";

// Mock Recharts to avoid DOM issues and simplify testing
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div data-testid="area" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Legend: () => <div data-testid="legend" />,
}));

describe("OverviewCharts", () => {
    const mockData = {
        userGrowth: [{ date: "2023-01-01", count: 10 }],
        reportStats: [{ date: "2023-01-01", count: 5 }],
        typeDistribution: [{ type: "restaurant", count: 20 }],
        topLocations: [{ address: "123 Main St", count: 50 }]
    };

    it("renders nothing when data is null", () => {
        const { container } = render(<OverviewCharts data={null as any} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders all charts when data is provided", () => {
        render(<OverviewCharts data={mockData} />);

        expect(screen.getByText("User Growth (30 Days)")).toBeInTheDocument();
        expect(screen.getByText("Reports Generated (30 Days)")).toBeInTheDocument();
        expect(screen.getByText("Search Type Distribution")).toBeInTheDocument();
        expect(screen.getByText("Top Searched Locations")).toBeInTheDocument();

        expect(screen.getByTestId("area-chart")).toBeInTheDocument();
        expect(screen.getAllByTestId("bar-chart")).toHaveLength(2);
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("renders without optional data", () => {
        const partialData = {
            userGrowth: mockData.userGrowth,
            reportStats: mockData.reportStats
        };

        render(<OverviewCharts data={partialData} />);

        expect(screen.getByText("User Growth (30 Days)")).toBeInTheDocument();
        expect(screen.queryByText("Search Type Distribution")).not.toBeInTheDocument();
        expect(screen.queryByText("Top Searched Locations")).not.toBeInTheDocument();
    });
});

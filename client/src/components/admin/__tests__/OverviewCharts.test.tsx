import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OverviewCharts } from "../OverviewCharts";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

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
    const series = [
        { date: "2023-01-01", users: 2, reports: 5 },
        { date: "2023-01-02", users: 0, reports: 3 },
    ];

    it("renders the user and report series charts", () => {
        render(<OverviewCharts series={series} typeDistribution={[]} periodDays={30} />);
        expect(screen.getByText("admin.charts.userGrowth")).toBeInTheDocument();
        expect(screen.getByText("admin.charts.reportsGenerated")).toBeInTheDocument();
        expect(screen.getAllByTestId("area-chart")).toHaveLength(2);
    });

    it("renders the business type distribution when present", () => {
        render(
            <OverviewCharts
                series={series}
                typeDistribution={[{ type: "restaurant", count: 20 }, { type: "cafe", count: 4 }]}
                periodDays={30}
            />,
        );
        expect(screen.getByText("admin.charts.businessTypes")).toBeInTheDocument();
        expect(screen.getAllByTestId("cell")).toHaveLength(2);
    });

    it("shows empty states instead of blank charts", () => {
        const empty = [{ date: "2023-01-01", users: 0, reports: 0 }];
        render(<OverviewCharts series={empty} typeDistribution={[]} periodDays={30} />);
        expect(screen.queryByTestId("area-chart")).not.toBeInTheDocument();
        expect(screen.getAllByText("admin.charts.noData")).toHaveLength(3);
    });
});

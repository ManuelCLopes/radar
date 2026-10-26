import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ApiUsageChart } from "../ApiUsageChart";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => options ? `${key} ${JSON.stringify(options)}` : key,
        i18n: { language: "en" },
    }),
}));

// Mock Recharts because it doesn't render well in JSDOM
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div className="recharts-bar-chart">{children}</div>,
    AreaChart: ({ children }: any) => <div>{children}</div>,
    Area: () => <div />,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: () => <div />,
    Cell: () => <div />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
}));

describe("ApiUsageChart", () => {
    it("renders the chart and totals when there is usage", () => {
        const data = {
            daily: [
                { date: "2023-01-01", google: 10, openAi: 2 },
                { date: "2023-01-02", google: 5, openAi: 1 },
            ],
            totals: { googleCalls: 15, openAiCalls: 3, openAiTokens: 12000 },
        };
        render(<ApiUsageChart data={data} />);
        expect(screen.getByText("admin.charts.apiUsage")).toBeInTheDocument();
        expect(screen.getByText(/admin\.charts\.apiUsageTotals/)).toHaveTextContent('"tokens":"12,000"');
        expect(document.querySelector(".recharts-responsive-container")).toBeInTheDocument();
    });

    it("renders a placeholder when every day is empty", () => {
        const data = {
            daily: [{ date: "2023-01-01", google: 0, openAi: 0 }],
            totals: { googleCalls: 0, openAiCalls: 0, openAiTokens: 0 },
        };
        render(<ApiUsageChart data={data} />);
        expect(screen.getByText("admin.charts.noUsage")).toBeInTheDocument();
        expect(document.querySelector(".recharts-responsive-container")).not.toBeInTheDocument();
    });

    it("renders a placeholder when data is undefined", () => {
        render(<ApiUsageChart data={undefined} />);
        expect(screen.getAllByText("admin.charts.noUsage").length).toBeGreaterThan(0);
    });
});


import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ApiUsageChart } from "../ApiUsageChart";

// Mock Recharts because it doesn't render well in JSDOM
vi.mock("recharts", () => {
    const OriginalModule = vi.importActual("recharts");
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
        BarChart: ({ children }: any) => <div className="recharts-bar-chart">{children}</div>,
        Bar: () => <div />,
        XAxis: () => <div />,
        YAxis: () => <div />,
        CartesianGrid: () => <div />,
        Tooltip: () => <div />,
        Legend: () => <div />,
    };
});

describe("ApiUsageChart", () => {
    it("should render chart when data is present", () => {
        const data = [
            { date: "2023-01-01", google: 10, openAi: 20 },
            { date: "2023-01-02", google: 5, openAi: 15 },
        ];
        render(<ApiUsageChart data={data} />);
        expect(screen.getByText("System API Usage & Costs (30 Days)")).toBeInTheDocument();
        // Check if chart container is rendered (mocked)
        expect(document.querySelector(".recharts-responsive-container")).toBeInTheDocument();
    });

    it("should render placeholder when data is empty", () => {
        render(<ApiUsageChart data={[]} />);
        expect(screen.getByText("System API Usage & Costs (30 Days)")).toBeInTheDocument();
        expect(screen.getByText("No usage data available.")).toBeInTheDocument();
    });

    it("should render placeholder when data is undefined", () => {
        render(<ApiUsageChart data={undefined as any} />);
        expect(screen.getByText("System API Usage & Costs (30 Days)")).toBeInTheDocument();
        expect(screen.getByText("No usage data available.")).toBeInTheDocument();
    });
});

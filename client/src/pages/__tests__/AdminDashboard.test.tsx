import { render, screen } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";

vi.mock("@/hooks/useAuth");
vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(),
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
// The layout (guard, header, navigation) is covered by its own test.
vi.mock("@/components/layouts/AdminLayout", () => ({
    default: ({ title, actions, children }: any) => (
        <div data-testid="admin-layout">
            <h1>{title}</h1>
            {actions}
            {children}
        </div>
    ),
    AdminLoading: () => <div data-testid="admin-loading" />,
}));
vi.mock("@/components/admin/OverviewCharts", () => ({
    OverviewCharts: () => <div data-testid="overview-charts" />,
}));
vi.mock("@/components/admin/ApiUsageChart", () => ({
    ApiUsageChart: () => <div data-testid="api-usage-chart" />,
}));
vi.mock("@/components/admin/TopConsumersTable", () => ({
    TopConsumersTable: () => <div data-testid="top-consumers-table" />,
}));

const overview = {
    periodDays: 30,
    users: { total: 1234, pro: 7, verified: 900, admins: 1, newInPeriod: 12 },
    reports: { total: 102, inPeriod: 40, last7Days: 9, guestPreviews: 87, pending: 1, failed: 3 },
    businesses: { total: 5 },
    proConversionRate: 0.6,
    avgCompetitors: 9,
    typeDistribution: [],
    series: [],
};

const mockQueries = (overviewResult: Record<string, unknown>) => {
    (useQuery as Mock).mockImplementation(({ queryKey }) => {
        if (queryKey[0] === "/api/admin/overview") return { refetch: vi.fn(), ...overviewResult };
        return { data: undefined, isLoading: false, refetch: vi.fn() };
    });
};

describe("AdminDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as Mock).mockReturnValue({ user: { role: "admin", firstName: "Ana" }, isLoading: false });
    });

    it("shows a loader while the overview loads", () => {
        mockQueries({ data: undefined, isLoading: true });
        render(<AdminDashboard />);
        expect(screen.getByTestId("admin-loading")).toBeInTheDocument();
    });

    it("shows an error instead of zeros when the overview fails", () => {
        mockQueries({ data: undefined, isLoading: false, isError: true });
        render(<AdminDashboard />);
        expect(screen.getByText("admin.dashboard.loadError")).toBeInTheDocument();
        expect(screen.queryByText("admin.dashboard.cards.totalUsers")).not.toBeInTheDocument();
    });

    it("renders the overview figures", () => {
        mockQueries({ data: overview, isLoading: false });
        render(<AdminDashboard />);

        expect(screen.getByRole("heading", { name: "admin.dashboard.title" })).toBeInTheDocument();
        expect(screen.getByText("1,234")).toBeInTheDocument();
        expect(screen.getByText("102")).toBeInTheDocument();
        expect(screen.getByText("admin.dashboard.cards.reportHealth")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByTestId("overview-charts")).toBeInTheDocument();
        expect(screen.getByTestId("api-usage-chart")).toBeInTheDocument();
        expect(screen.getByTestId("top-consumers-table")).toBeInTheDocument();
    });

    it("only queries admin endpoints for admins", () => {
        (useAuth as Mock).mockReturnValue({ user: { role: "user" }, isLoading: false });
        mockQueries({ data: undefined, isLoading: false });
        render(<AdminDashboard />);
        for (const [options] of (useQuery as Mock).mock.calls) {
            expect(options.enabled).toBe(false);
        }
    });
});

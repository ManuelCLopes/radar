import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopConsumersTable } from "../TopConsumersTable";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe("TopConsumersTable", () => {
    const mockData = [
        {
            userId: "1",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            totalRequests: 100,
            totalCost: 500
        },
        {
            userId: "2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            totalRequests: 200,
            totalCost: 1000
        }
    ];

    it("renders table headers", () => {
        render(<TopConsumersTable data={[]} />);
        expect(screen.getByText("admin.consumers.title")).toBeInTheDocument();
        expect(screen.getByText("admin.consumers.columns.user")).toBeInTheDocument();
        expect(screen.getByText("admin.consumers.columns.requests")).toBeInTheDocument();
        expect(screen.getByText("admin.consumers.columns.cost")).toBeInTheDocument();
    });

    it("renders empty state when no data", () => {
        render(<TopConsumersTable data={[]} />);
        expect(screen.getByText("admin.consumers.noData")).toBeInTheDocument();
    });

    it("renders user rows correctly", () => {
        render(<TopConsumersTable data={mockData} />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("500")).toBeInTheDocument();

        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("200")).toBeInTheDocument();
        expect(screen.getByText("1000")).toBeInTheDocument();
    });

    it("handles null data gracefully", () => {
        render(<TopConsumersTable data={null as any} />);
        expect(screen.getByText("admin.consumers.noData")).toBeInTheDocument();
    });
});

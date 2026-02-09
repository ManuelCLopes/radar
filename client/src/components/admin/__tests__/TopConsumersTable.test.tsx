import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TopConsumersTable } from "../TopConsumersTable";

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
        expect(screen.getByText("Top API Consumers")).toBeInTheDocument();
        expect(screen.getByText("User")).toBeInTheDocument();
        expect(screen.getByText("Requests")).toBeInTheDocument();
        expect(screen.getByText("Est. Cost Units")).toBeInTheDocument();
    });

    it("renders empty state when no data", () => {
        render(<TopConsumersTable data={[]} />);
        expect(screen.getByText("No consumer data available.")).toBeInTheDocument();
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
        expect(screen.getByText("No consumer data available.")).toBeInTheDocument();
    });
});

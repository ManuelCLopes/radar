import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Toaster } from "../toaster";

// Mock the useToast hook
vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toasts: [
            {
                id: "1",
                title: "Test Toast",
                description: "This is a test toast",
            },
            {
                id: "2",
                title: "Another Toast",
            },
        ],
    }),
}));

describe("Toaster", () => {
    it("should render toaster component", () => {
        const { container } = render(<Toaster />);
        expect(container).toBeInTheDocument();
    });

    it("should render toasts from useToast hook", () => {
        render(<Toaster />);
        expect(screen.getByText("Test Toast")).toBeInTheDocument();
        expect(screen.getByText("This is a test toast")).toBeInTheDocument();
        expect(screen.getByText("Another Toast")).toBeInTheDocument();
    });

    it("should render toast with title only", () => {
        render(<Toaster />);
        expect(screen.getByText("Another Toast")).toBeInTheDocument();
    });
});

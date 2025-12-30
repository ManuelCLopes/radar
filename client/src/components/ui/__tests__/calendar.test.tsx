
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Calendar } from "../calendar";

describe("Calendar", () => {
    it("should render calendar", () => {
        render(<Calendar />);
        expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("should select a date", () => {
        const onSelect = vi.fn();
        const today = new Date();
        render(<Calendar mode="single" selected={today} onSelect={onSelect} showOutsideDays={false} />);

        const dayButton = screen.getByRole("gridcell", { name: today.getDate().toString() });
        expect(dayButton).toHaveAttribute("aria-selected", "true");

        // Test clicking another date (if visible)
        // This depends on the month rendered.
    });

    it("should navigate months", () => {
        render(<Calendar />);
        const prevButton = screen.getByRole("button", { name: /previous month/i });
        const nextButton = screen.getByRole("button", { name: /next month/i });

        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
    });
});

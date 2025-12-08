import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Toggle } from "../toggle";

describe("Toggle", () => {
    it("should render toggle button", () => {
        render(<Toggle>Toggle me</Toggle>);
        expect(screen.getByText("Toggle me")).toBeInTheDocument();
    });

    it("should toggle on click", async () => {
        const user = userEvent.setup();
        render(<Toggle>Toggle</Toggle>);

        const toggle = screen.getByText("Toggle");
        await user.click(toggle);
        expect(toggle).toHaveAttribute("data-state", "on");

        await user.click(toggle);
        expect(toggle).toHaveAttribute("data-state", "off");
    });

    it("should render with default variant", () => {
        render(<Toggle>Default</Toggle>);
        expect(screen.getByText("Default")).toHaveClass("bg-transparent");
    });

    it("should render with outline variant", () => {
        render(<Toggle variant="outline">Outline</Toggle>);
        expect(screen.getByText("Outline")).toHaveClass("border");
    });

    it("should render with different sizes", () => {
        const { rerender } = render(<Toggle size="sm">Small</Toggle>);
        expect(screen.getByText("Small")).toHaveClass("h-9");

        rerender(<Toggle size="lg">Large</Toggle>);
        expect(screen.getByText("Large")).toHaveClass("h-11");
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Toggle disabled>Disabled</Toggle>);
        expect(screen.getByText("Disabled")).toBeDisabled();
    });
});

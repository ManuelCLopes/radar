import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "../button";

describe("Button", () => {
    it("should render button with text", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("should apply variant classes", () => {
        const { rerender } = render(<Button variant="destructive">Delete</Button>);
        expect(screen.getByRole("button")).toHaveClass("bg-destructive");

        rerender(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole("button")).toHaveClass("border");

        rerender(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole("button")).toHaveClass("border-transparent");
    });

    it("should apply size classes", () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole("button")).toHaveClass("min-h-8");

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole("button")).toHaveClass("min-h-10");

        rerender(<Button size="icon">Icon</Button>);
        expect(screen.getByRole("button")).toHaveClass("h-9", "w-9");
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should forward custom className", () => {
        render(<Button className="custom-class">Custom</Button>);
        expect(screen.getByRole("button")).toHaveClass("custom-class");
    });
});

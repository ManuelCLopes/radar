import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "../badge";

describe("Badge", () => {
    it("should render badge with text", () => {
        render(<Badge>Badge Text</Badge>);
        expect(screen.getByText("Badge Text")).toBeInTheDocument();
    });

    it("should apply variant classes", () => {
        const { rerender } = render(<Badge variant="default">Default</Badge>);
        expect(screen.getByText("Default")).toHaveClass("bg-primary");

        rerender(<Badge variant="secondary">Secondary</Badge>);
        expect(screen.getByText("Secondary")).toHaveClass("bg-secondary");

        rerender(<Badge variant="destructive">Destructive</Badge>);
        expect(screen.getByText("Destructive")).toHaveClass("bg-destructive");

        rerender(<Badge variant="outline">Outline</Badge>);
        expect(screen.getByText("Outline")).toHaveClass("border");
    });

    it("should forward custom className", () => {
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText("Custom")).toHaveClass("custom-class");
    });
});

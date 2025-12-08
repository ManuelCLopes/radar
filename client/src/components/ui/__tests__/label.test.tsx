import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Label } from "../label";

describe("Label", () => {
    it("should render label with text", () => {
        render(<Label>Label Text</Label>);
        expect(screen.getByText("Label Text")).toBeInTheDocument();
    });

    it("should render label with htmlFor attribute", () => {
        render(<Label htmlFor="input-id">Field Label</Label>);
        const label = screen.getByText("Field Label");
        expect(label).toHaveAttribute("for", "input-id");
    });

    it("should apply custom className", () => {
        render(<Label className="custom-label">Text</Label>);
        expect(screen.getByText("Text")).toHaveClass("custom-label");
    });

    it("should forward ref", () => {
        const ref = { current: null };
        render(<Label ref={ref as any}>Ref Label</Label>);
        expect(ref.current).not.toBeNull();
    });
});

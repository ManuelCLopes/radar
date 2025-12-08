import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Separator } from "../separator";

describe("Separator", () => {
    it("should render horizontal separator by default", () => {
        const { container } = render(<Separator />);
        const separator = container.querySelector('[data-orientation="horizontal"]');
        expect(separator).toBeInTheDocument();
    });

    it("should render vertical separator when orientation is vertical", () => {
        const { container } = render(<Separator orientation="vertical" />);
        const separator = container.querySelector('[data-orientation="vertical"]');
        expect(separator).toBeInTheDocument();
    });

    it("should apply horizontal styles", () => {
        const { container } = render(<Separator orientation="horizontal" />);
        const separator = container.firstChild as HTMLElement;
        expect(separator).toHaveClass("h-[1px]");
        expect(separator).toHaveClass("w-full");
    });

    it("should apply vertical styles", () => {
        const { container } = render(<Separator orientation="vertical" />);
        const separator = container.firstChild as HTMLElement;
        expect(separator).toHaveClass("h-full");
        expect(separator).toHaveClass("w-[1px]");
    });

    it("should apply custom className", () => {
        const { container } = render(<Separator className="custom-separator" />);
        const separator = container.firstChild as HTMLElement;
        expect(separator).toHaveClass("custom-separator");
    });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Slider } from "../slider";

describe("Slider", () => {
    it("should render slider", () => {
        const { container } = render(<Slider defaultValue={[50]} max={100} step={1} />);
        expect(container.querySelector('[role="slider"]')).toBeInTheDocument();
    });

    it("should render with default value", () => {
        const { container } = render(<Slider defaultValue={[30]} max={100} />);
        const slider = container.querySelector('[role="slider"]');
        expect(slider).toHaveAttribute("aria-valuenow", "30");
    });

    it("should render with min and max values", () => {
        const { container } = render(
            <Slider defaultValue={[50]} min={0} max={100} />
        );
        const slider = container.querySelector('[role="slider"]');
        expect(slider).toHaveAttribute("aria-valuemin", "0");
        expect(slider).toHaveAttribute("aria-valuemax", "100");
    });

    it("should be disabled when disabled prop is true", () => {
        const { container } = render(<Slider defaultValue={[50]} disabled />);
        const slider = container.querySelector('[role="slider"]');
        expect(slider).toHaveAttribute("data-disabled");
    });

    it("should apply custom className", () => {
        const { container } = render(
            <Slider defaultValue={[50]} className="custom-slider" />
        );
        const sliderRoot = container.firstChild as HTMLElement;
        expect(sliderRoot).toHaveClass("custom-slider");
    });
});

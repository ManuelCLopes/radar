import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";

describe("ToggleGroup", () => {
    it("should render toggle group", () => {
        const { container } = render(
            <ToggleGroup type="single">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
            </ToggleGroup>
        );
        expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    });

    it("should render toggle group items", () => {
        render(
            <ToggleGroup type="single">
                <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
                <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
                <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
            </ToggleGroup>
        );
        expect(screen.getByText("Bold")).toBeInTheDocument();
        expect(screen.getByText("Italic")).toBeInTheDocument();
        expect(screen.getByText("Underline")).toBeInTheDocument();
    });

    it("should toggle item on click", async () => {
        const user = userEvent.setup();
        render(
            <ToggleGroup type="single">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
            </ToggleGroup>
        );

        const item = screen.getByText("A");
        await user.click(item);
        expect(item).toHaveAttribute("data-state", "on");
    });

    it("should apply custom className", () => {
        const { container } = render(
            <ToggleGroup type="single" className="custom-group">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
            </ToggleGroup>
        );
        expect(container.querySelector('[role="group"]')).toHaveClass("custom-group");
    });
});

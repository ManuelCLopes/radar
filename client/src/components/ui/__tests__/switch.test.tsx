import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Switch } from "../switch";

describe("Switch", () => {
    it("should render switch", () => {
        render(<Switch />);
        expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should not be checked by default", () => {
        render(<Switch />);
        expect(screen.getByRole("switch")).not.toBeChecked();
    });

    it("should toggle when clicked", async () => {
        const user = userEvent.setup();
        render(<Switch />);

        const switchElement = screen.getByRole("switch");
        expect(switchElement).not.toBeChecked();

        await user.click(switchElement);
        expect(switchElement).toBeChecked();

        await user.click(switchElement);
        expect(switchElement).not.toBeChecked();
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Switch disabled />);
        expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should apply custom className", () => {
        render(<Switch className="custom-switch" />);
        expect(screen.getByRole("switch")).toHaveClass("custom-switch");
    });

    it("should be checked when checked prop is true", () => {
        render(<Switch checked />);
        expect(screen.getByRole("switch")).toBeChecked();
    });
});

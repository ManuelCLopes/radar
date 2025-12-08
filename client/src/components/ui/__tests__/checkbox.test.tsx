import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
    it("should render checkbox", () => {
        render(<Checkbox />);
        expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should be unchecked by default", () => {
        render(<Checkbox />);
        expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("should toggle when clicked", async () => {
        const user = userEvent.setup();
        render(<Checkbox />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);
        expect(checkbox).toBeChecked();

        await user.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Checkbox disabled />);
        expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("should apply custom className", () => {
        render(<Checkbox className="custom-checkbox" />);
        expect(screen.getByRole("checkbox")).toHaveClass("custom-checkbox");
    });

    it("should be checked when checked prop is true", () => {
        render(<Checkbox checked />);
        expect(screen.getByRole("checkbox")).toBeChecked();
    });
});

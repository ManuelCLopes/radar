import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Textarea } from "../textarea";

describe("Textarea", () => {
    it("should render textarea", () => {
        render(<Textarea placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("should accept text input", async () => {
        const user = userEvent.setup();
        render(<Textarea data-testid="textarea" />);

        const textarea = screen.getByTestId("textarea");
        await user.type(textarea, "Hello World");

        expect(textarea).toHaveValue("Hello World");
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Textarea disabled data-testid="textarea" />);
        expect(screen.getByTestId("textarea")).toBeDisabled();
    });

    it("should apply custom className", () => {
        render(<Textarea className="custom-textarea" data-testid="textarea" />);
        expect(screen.getByTestId("textarea")).toHaveClass("custom-textarea");
    });

    it("should display initial value", () => {
        render(<Textarea defaultValue="Initial text" data-testid="textarea" />);
        expect(screen.getByTestId("textarea")).toHaveValue("Initial text");
    });

    it("should handle onChange events", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<Textarea onChange={onChange} data-testid="textarea" />);

        await user.type(screen.getByTestId("textarea"), "a");
        expect(onChange).toHaveBeenCalled();
    });
});

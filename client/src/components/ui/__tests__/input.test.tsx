import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "../input";

describe("Input", () => {
    it("should render input element", () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("should accept different types", () => {
        const { rerender } = render(<Input type="text" data-testid="input" />);
        expect(screen.getByTestId("input")).toHaveAttribute("type", "text");

        rerender(<Input type="password" data-testid="input" />);
        expect(screen.getByTestId("input")).toHaveAttribute("type", "password");

        rerender(<Input type="email" data-testid="input" />);
        expect(screen.getByTestId("input")).toHaveAttribute("type", "email");
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Input disabled data-testid="input" />);
        expect(screen.getByTestId("input")).toBeDisabled();
    });

    it("should forward custom className", () => {
        render(<Input className="custom-class" data-testid="input" />);
        expect(screen.getByTestId("input")).toHaveClass("custom-class");
    });

    it("should handle onChange events", () => {
        const onChange = vi.fn();
        render(<Input onChange={onChange} data-testid="input" />);

        const input = screen.getByTestId("input");
        fireEvent.change(input, { target: { value: "test" } });

        expect(onChange).toHaveBeenCalled();
    });
});

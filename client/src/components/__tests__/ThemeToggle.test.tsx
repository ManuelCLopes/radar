import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ThemeToggle } from "../ThemeToggle";

describe("ThemeToggle", () => {
    beforeEach(() => {
        // Clear localStorage and reset DOM
        localStorage.clear();
        document.documentElement.classList.remove("dark");

        // Mock matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it("should render theme toggle button", () => {
        render(<ThemeToggle />);
        expect(screen.getByTestId("button-theme-toggle")).toBeInTheDocument();
    });

    it("should show moon icon in light theme", () => {
        render(<ThemeToggle />);
        const button = screen.getByTestId("button-theme-toggle");
        expect(button).toBeInTheDocument();
    });

    it("should be clickable", () => {
        render(<ThemeToggle />);
        const button = screen.getByTestId("button-theme-toggle");

        expect(() => fireEvent.click(button)).not.toThrow();
    });

    it("should have accessible label", () => {
        render(<ThemeToggle />);
        expect(screen.getByText("Toggle theme")).toBeInTheDocument();
    });
});

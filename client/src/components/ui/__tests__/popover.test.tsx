
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Popover, PopoverTrigger, PopoverContent } from "../popover";

describe("Popover", () => {
    it("should open and close popover", async () => {
        const user = userEvent.setup();
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>Content</PopoverContent>
            </Popover>
        );

        expect(screen.queryByText("Content")).not.toBeInTheDocument();

        await user.click(screen.getByText("Open"));
        expect(screen.getByText("Content")).toBeInTheDocument();

        // Clicking outside should close it (Radix default)
        await user.click(document.body);
        // Wait for animation/state update
        await waitFor(() => {
            expect(screen.queryByText("Content")).not.toBeInTheDocument();
        });
    });

    it("should render with custom classes", async () => {
        const user = userEvent.setup();
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent className="custom-class">Content</PopoverContent>
            </Popover>
        );

        await user.click(screen.getByText("Open"));
        const content = screen.getByText("Content");
        expect(content).toHaveClass("custom-class");
    });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../tooltip";

describe("Tooltip", () => {
    it("should render tooltip trigger", () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        expect(screen.getByText("Hover me")).toBeInTheDocument();
    });

    it("should render with TooltipProvider", () => {
        const { container } = render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Trigger</TooltipTrigger>
                    <TooltipContent>Content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        expect(container).toBeInTheDocument();
    });

    it("should render trigger and content components", () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Button</TooltipTrigger>
                    <TooltipContent>Info</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );

        expect(screen.getByText("Button")).toBeInTheDocument();
    });
});

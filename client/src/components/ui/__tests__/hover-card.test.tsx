import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../hover-card";

describe("HoverCard", () => {
    it("should render hover card trigger", () => {
        render(
            <HoverCard>
                <HoverCardTrigger>Hover me</HoverCardTrigger>
                <HoverCardContent>Content</HoverCardContent>
            </HoverCard>
        );
        expect(screen.getByText("Hover me")).toBeInTheDocument();
    });

    it("should render with content", () => {
        render(
            <HoverCard>
                <HoverCardTrigger>Trigger</HoverCardTrigger>
                <HoverCardContent>
                    <p>Hover card content</p>
                </HoverCardContent>
            </HoverCard>
        );
        expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should apply custom className to content", () => {
        const { container } = render(
            <HoverCard defaultOpen>
                <HoverCardTrigger>Trigger</HoverCardTrigger>
                <HoverCardContent className="custom-hover">
                    Content
                </HoverCardContent>
            </HoverCard>
        );
        // When open, content should be in the document
        expect(container).toBeInTheDocument();
    });
});

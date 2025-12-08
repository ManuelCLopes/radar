import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../collapsible";

describe("Collapsible", () => {
    it("should render collapsible", () => {
        render(
            <Collapsible>
                <CollapsibleTrigger>Toggle</CollapsibleTrigger>
                <CollapsibleContent>Hidden content</CollapsibleContent>
            </Collapsible>
        );
        expect(screen.getByText("Toggle")).toBeInTheDocument();
    });

    it("should render trigger and content", () => {
        render(
            <Collapsible>
                <CollapsibleTrigger>Button</CollapsibleTrigger>
                <CollapsibleContent>Content</CollapsibleContent>
            </Collapsible>
        );

        expect(screen.getByText("Button")).toBeInTheDocument();
    });

    it("should render with defaultOpen", () => {
        render(
            <Collapsible defaultOpen>
                <CollapsibleTrigger>Trigger</CollapsibleTrigger>
                <CollapsibleContent>Open by default</CollapsibleContent>
            </Collapsible>
        );

        expect(screen.getByText("Open by default")).toBeInTheDocument();
    });

    it("should render when controlled", () => {
        render(
            <Collapsible open={true}>
                <CollapsibleTrigger>Trigger</CollapsibleTrigger>
                <CollapsibleContent>Controlled content</CollapsibleContent>
            </Collapsible>
        );

        expect(screen.getByText("Controlled content")).toBeInTheDocument();
    });
});

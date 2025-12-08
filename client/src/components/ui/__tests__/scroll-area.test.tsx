import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScrollArea } from "../scroll-area";

describe("ScrollArea", () => {
    it("should render scroll area with content", () => {
        const { container } = render(
            <ScrollArea>
                <div>Scrollable content</div>
            </ScrollArea>
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it("should render children", () => {
        render(
            <ScrollArea>
                <div>Content 1</div>
                <div>Content 2</div>
            </ScrollArea>
        );
        expect(document.body).toHaveTextContent("Content 1");
        expect(document.body).toHaveTextContent("Content 2");
    });

    it("should apply custom className", () => {
        const { container } = render(
            <ScrollArea className="custom-scroll">
                <div>Content</div>
            </ScrollArea>
        );
        const scrollArea = container.firstChild as HTMLElement;
        expect(scrollArea).toHaveClass("custom-scroll");
    });

    it("should have overflow-hidden class", () => {
        const { container } = render(
            <ScrollArea>
                <div>Content</div>
            </ScrollArea>
        );
        const scrollArea = container.firstChild as HTMLElement;
        expect(scrollArea).toHaveClass("overflow-hidden");
    });
});

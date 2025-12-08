import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../resizable";

describe("Resizable", () => {
    it("should render resizable panel group", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>Panel 1</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel>Panel 2</ResizablePanel>
            </ResizablePanelGroup>
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it("should render panels with content", () => {
        render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>First Panel</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel>Second Panel</ResizablePanel>
            </ResizablePanelGroup>
        );
        expect(document.body).toHaveTextContent("First Panel");
        expect(document.body).toHaveTextContent("Second Panel");
    });

    it("should render handle with grip", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>Panel 1</ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel>Panel 2</ResizablePanel>
            </ResizablePanelGroup>
        );
        expect(container.querySelector('[data-panel-resize-handle-id]')).toBeInTheDocument();
    });

    it("should render vertical layout", () => {
        const { container } = render(
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel>Top</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel>Bottom</ResizablePanel>
            </ResizablePanelGroup>
        );
        expect(container.firstChild).toHaveAttribute("data-panel-group-direction", "vertical");
    });

    it("should apply custom className", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal" className="custom-group">
                <ResizablePanel>Panel</ResizablePanel>
            </ResizablePanelGroup>
        );
        expect(container.firstChild).toHaveClass("custom-group");
    });
});

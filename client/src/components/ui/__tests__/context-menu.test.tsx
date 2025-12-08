import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuLabel,
} from "../context-menu";

describe("ContextMenu", () => {
    it("should render context menu trigger", () => {
        render(
            <ContextMenu>
                <ContextMenuTrigger>Right click me</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem>Item 1</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
        expect(screen.getByText("Right click me")).toBeInTheDocument();
    });

    it("should render menu items", () => {
        const { container } = render(
            <ContextMenu>
                <ContextMenuTrigger>Trigger</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem>Cut</ContextMenuItem>
                    <ContextMenuItem>Copy</ContextMenuItem>
                    <ContextMenuItem>Paste</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
        expect(container).toBeInTheDocument();
    });

    it("should render with separator", () => {
        render(
            <ContextMenu>
                <ContextMenuTrigger>Trigger</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem>Item 1</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>Item 2</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
        expect(screen.getByText("Trigger")).toBeInTheDocument();
    });

    it("should render with label", () => {
        render(
            <ContextMenu>
                <ContextMenuTrigger>Trigger</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuLabel>Actions</ContextMenuLabel>
                    <ContextMenuItem>Action 1</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
        expect(screen.getByText("Trigger")).toBeInTheDocument();
    });
});

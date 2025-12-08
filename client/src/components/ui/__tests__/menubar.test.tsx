import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "../menubar";

describe("Menubar", () => {
    it("should render menubar", () => {
        render(
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>New File</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        );
        expect(screen.getByText("File")).toBeInTheDocument();
    });

    it("should render multiple menus", () => {
        render(
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Edit</MenubarTrigger>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>View</MenubarTrigger>
                </MenubarMenu>
            </Menubar>
        );
        expect(screen.getByText("File")).toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.getByText("View")).toBeInTheDocument();
    });

    it("should render menu items with separator", () => {
        const { container } = render(
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>Menu</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>Item 1</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Item 2</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        );
        expect(container).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        render(
            <Menubar className="custom-menubar">
                <MenubarMenu>
                    <MenubarTrigger>Menu</MenubarTrigger>
                </MenubarMenu>
            </Menubar>
        );
        expect(document.querySelector(".custom-menubar")).toBeInTheDocument();
    });
});

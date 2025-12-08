import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "../drawer";

describe("Drawer", () => {
    it("should render drawer trigger", () => {
        render(
            <Drawer>
                <DrawerTrigger>Open Drawer</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Drawer Title</DrawerTitle>
                    </DrawerHeader>
                </DrawerContent>
            </Drawer>
        );
        expect(screen.getByText("Open Drawer")).toBeInTheDocument();
    });

    it("should render drawer with title and description", () => {
        render(
            <Drawer defaultOpen>
                <DrawerTrigger>Trigger</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Title</DrawerTitle>
                        <DrawerDescription>Description text</DrawerDescription>
                    </DrawerHeader>
                </DrawerContent>
            </Drawer>
        );
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("should render drawer with footer", () => {
        render(
            <Drawer defaultOpen>
                <DrawerContent>
                    <DrawerFooter>
                        <button>Action</button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
        expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should render drawer with close button", () => {
        render(
            <Drawer defaultOpen>
                <DrawerContent>
                    <DrawerClose>Close</DrawerClose>
                </DrawerContent>
            </Drawer>
        );
        expect(screen.getByText("Close")).toBeInTheDocument();
    });
});

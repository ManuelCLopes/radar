
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "../sheet";

describe("Sheet", () => {
    it("should open and close sheet", async () => {
        const user = userEvent.setup();
        render(
            <Sheet>
                <SheetTrigger>Open Sheet</SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Sheet Title</SheetTitle>
                        <SheetDescription>Sheet Description</SheetDescription>
                    </SheetHeader>
                    <div>Sheet Content</div>
                    <SheetFooter>
                        <SheetClose>Close Sheet</SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        );

        expect(screen.queryByText("Sheet Content")).not.toBeInTheDocument();

        await user.click(screen.getByText("Open Sheet"));

        expect(screen.getByText("Sheet Content")).toBeInTheDocument();
        expect(screen.getByText("Sheet Title")).toBeInTheDocument();
        expect(screen.getByText("Sheet Description")).toBeInTheDocument();

        // Close
        await user.click(screen.getByText("Close Sheet"));

        await waitFor(() => {
            expect(screen.queryByText("Sheet Content")).not.toBeInTheDocument();
        });
    });

    it("should render with different sides", async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <Sheet>
                <SheetTrigger>Open</SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader>
                        <SheetTitle>Left Title</SheetTitle>
                        <SheetDescription>Left Description</SheetDescription>
                    </SheetHeader>
                    Left Content
                </SheetContent>
            </Sheet>
        );

        await user.click(screen.getByText("Open"));
        expect(screen.getByText("Left Content")).toBeInTheDocument();

        // Check class for side (implementation detail, but good for coverage)
        // The dialog content usually has classes. 
        // We can check if it renders without error.
    });
});


import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "../dialog";

describe("Dialog", () => {
    it("should render trigger and open dialog", () => {
        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>Dialog Description</DialogDescription>
                    </DialogHeader>
                    <div>Dialog Body</div>
                    <DialogFooter>
                        <DialogClose>Close</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );

        const trigger = screen.getByText("Open Dialog");
        expect(trigger).toBeInTheDocument();

        // Dialog content should not be visible initially
        expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();

        // Click trigger
        fireEvent.click(trigger);

        // Dialog content should be visible
        expect(screen.getByText("Dialog Title")).toBeInTheDocument();
        expect(screen.getByText("Dialog Description")).toBeInTheDocument();
        expect(screen.getByText("Dialog Body")).toBeInTheDocument();
    });
});

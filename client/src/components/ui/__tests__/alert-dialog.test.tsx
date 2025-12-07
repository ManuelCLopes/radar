
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../alert-dialog";

// Mock PointerEvent for Radix UI
window.PointerEvent = class PointerEvent extends Event {
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    button: number;
    buttons: number;
    clientX: number;
    clientY: number;
    screenX: number;
    screenY: number;
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        this.ctrlKey = props.ctrlKey || false;
        this.metaKey = props.metaKey || false;
        this.shiftKey = props.shiftKey || false;
        this.altKey = props.altKey || false;
        this.button = props.button || 0;
        this.buttons = props.buttons || 0;
        this.clientX = props.clientX || 0;
        this.clientY = props.clientY || 0;
        this.screenX = props.screenX || 0;
        this.screenY = props.screenY || 0;
        this.pointerId = props.pointerId || 0;
        this.width = props.width || 0;
        this.height = props.height || 0;
        this.pressure = props.pressure || 0;
        this.tangentialPressure = props.tangentialPressure || 0;
        this.tiltX = props.tiltX || 0;
        this.tiltY = props.tiltY || 0;
        this.twist = props.twist || 0;
        this.pointerType = props.pointerType || "";
        this.isPrimary = props.isPrimary || false;
    }
};

// Mock HTMLElement methods
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();

describe("AlertDialog", () => {
    it("should open and close alert dialog", async () => {
        const user = userEvent.setup();
        render(
            <AlertDialog>
                <AlertDialogTrigger>Open</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );

        await user.click(screen.getByText("Open"));

        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
        expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();

        await user.click(screen.getByText("Cancel"));

        await waitFor(() => {
            expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
        });
    });

    it("should trigger action", async () => {
        const user = userEvent.setup();
        const onAction = vi.fn();

        render(
            <AlertDialog>
                <AlertDialogTrigger>Open</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Title</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={onAction}>Action</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );

        await user.click(screen.getByText("Open"));
        await user.click(screen.getByText("Action"));

        expect(onAction).toHaveBeenCalled();
    });
});

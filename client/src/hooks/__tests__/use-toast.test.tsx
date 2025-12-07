
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "../use-toast";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("useToast", () => {
    beforeEach(() => {
        // Reset state
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.dismiss();
        });
    });

    it("should add a toast", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: "Test Toast" });
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe("Test Toast");
    });

    it("should limit toasts to 1", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: "Toast 1" });
            toast({ title: "Toast 2" });
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe("Toast 2");
    });

    it("should dismiss a toast", () => {
        const { result } = renderHook(() => useToast());

        let toastId: string;
        act(() => {
            const t = toast({ title: "Toast to dismiss" });
            toastId = t.id;
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].open).toBe(true);

        act(() => {
            result.current.dismiss(toastId);
        });

        // Dismiss sets open to false, but doesn't remove immediately (it queues removal)
        expect(result.current.toasts[0].open).toBe(false);
    });

    it("should update a toast", () => {
        const { result } = renderHook(() => useToast());

        let update: (props: any) => void;
        act(() => {
            const t = toast({ title: "Original Title" });
            update = t.update;
        });

        expect(result.current.toasts[0].title).toBe("Original Title");

        act(() => {
            update({ title: "Updated Title" });
        });

        expect(result.current.toasts[0].title).toBe("Updated Title");
    });
});

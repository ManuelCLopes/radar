
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIsMobile } from "../use-mobile";

describe("useIsMobile", () => {
    let originalInnerWidth: number;
    let changeHandler: ((e: any) => void) | null = null;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;

        // Mock matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn((event, handler) => {
                    if (event === "change") {
                        changeHandler = handler;
                    }
                }),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        });
        changeHandler = null;
    });

    it("should return true if width < 768", () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 500,
        });

        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it("should return false if width >= 768", () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 1024,
        });

        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it("should update when window resizes", () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 1024,
        });

        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        // Simulate resize
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 500,
        });

        act(() => {
            if (changeHandler) {
                changeHandler({ matches: true } as any);
            }
        });

        expect(result.current).toBe(true);
    });
});

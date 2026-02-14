
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, queryClient } from "../queryClient";

describe("queryClient", () => {
    describe("apiRequest", () => {
        beforeEach(() => {
            global.fetch = vi.fn();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("should call fetch with correct arguments", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await apiRequest("POST", "/api/test", { foo: "bar" });

            expect(global.fetch).toHaveBeenCalledWith("/api/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ foo: "bar" }),
                credentials: "include",
            });
        });

        it("should throw error on non-ok response", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 400,
                text: async () => "Bad Request",
                statusText: "Bad Request",
            });

            await expect(apiRequest("GET", "/api/test")).rejects.toThrow("Bad Request");
        });

        it("should throw error if text reading fails", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                text: async () => { throw new Error("Network Error") },
                statusText: "Internal Server Error"
            });

            await expect(apiRequest("GET", "/api/test")).rejects.toThrow("Network Error");
        });

        it("should not set Content-Type for GET requests without body", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await apiRequest("GET", "/api/test");

            expect(global.fetch).toHaveBeenCalledWith("/api/test", {
                method: "GET",
                headers: {},
                body: undefined,
                credentials: "include",
            });
        });
    });

    describe("queryClient config", () => {
        it("should have correct default options", () => {
            const defaults = queryClient.getDefaultOptions();
            expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
            expect(defaults.queries?.retry).toBe(false);
            expect(defaults.queries?.staleTime).toBe(Infinity);
        });
    });
});

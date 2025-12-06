
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "../useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock apiRequest and queryClient
vi.mock("@/lib/queryClient", () => ({
    apiRequest: vi.fn(),
    queryClient: {
        setQueryData: vi.fn(),
        invalidateQueries: vi.fn(),
    },
}));

import { apiRequest, queryClient } from "@/lib/queryClient";

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe("useAuth", () => {
    let queryClientInstance: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClientInstance = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        // Mock global fetch
        global.fetch = vi.fn();
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClientInstance}>
            {children}
        </QueryClientProvider>
    );

    it("should return initial state", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ user: { id: "1", email: "test@example.com" } }),
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.user).toBeUndefined();

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toEqual({ id: "1", email: "test@example.com" });
        expect(result.current.isAuthenticated).toBe(true);
    });

    it("should handle unauthenticated user", async () => {
        (global.fetch as any).mockResolvedValue({
            status: 401,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle login success", async () => {
        const mockUser = { id: "1", email: "test@example.com" };
        (apiRequest as any).mockResolvedValue({
            json: async () => mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await result.current.loginMutation.mutateAsync({ email: "test@example.com", password: "password" });

        expect(apiRequest).toHaveBeenCalledWith("POST", "/api/login", { email: "test@example.com", password: "password" });
        expect(queryClient.setQueryData).toHaveBeenCalledWith(["/api/auth/user"], mockUser);
    });

    it("should handle logout success", async () => {
        (apiRequest as any).mockResolvedValue({});

        const { result } = renderHook(() => useAuth(), { wrapper });

        await result.current.logoutMutation.mutateAsync();

        expect(apiRequest).toHaveBeenCalledWith("POST", "/api/auth/logout");
        expect(queryClient.setQueryData).toHaveBeenCalledWith(["/api/auth/user"], null);
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["/api/auth/user"] });
    });

    it("should handle registration success", async () => {
        const mockUser = { id: "1", email: "new@example.com" };
        (apiRequest as any).mockResolvedValue({
            json: async () => mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await result.current.registerMutation.mutateAsync({ email: "new@example.com", password: "password" });

        expect(apiRequest).toHaveBeenCalledWith("POST", "/api/register", { email: "new@example.com", password: "password" });
        expect(queryClient.setQueryData).toHaveBeenCalledWith(["/api/auth/user"], mockUser);
    });
});


import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";

// Mock hooks
vi.mock("@/hooks/useAuth");
vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(),
    QueryClient: vi.fn(),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("wouter", () => ({
    useLocation: vi.fn(),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
// Mock translation
vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe("AdminDashboard", () => {
    const mockSetLocation = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useLocation as Mock).mockReturnValue(["/admin", mockSetLocation]);
    });

    it("should redirect non-admin users", () => {
        (useAuth as Mock).mockReturnValue({
            user: { role: "user" },
            isLoading: false,
        });

        // useQuery should not be enabled/called effectively or return nothing relevant
        (useQuery as Mock).mockReturnValue({
            data: null,
            isLoading: false,
        });

        const { container } = render(<AdminDashboard />);

        expect(mockSetLocation).toHaveBeenCalledWith("/");
        expect(container).toBeEmptyDOMElement();
    });

    it("should show loading state while fetching stats", () => {
        (useAuth as Mock).mockReturnValue({
            user: { role: "admin" },
            isLoading: false,
        });

        (useQuery as Mock).mockReturnValue({
            data: null,
            isLoading: true,
        });

        render(<AdminDashboard />);

        // Should find loader (we can look for role="status" or class depending on Loader2 implementation, 
        // but simplest is to check if it's NOT empty and maybe check for a known element if we added one, 
        // or just check that it didn't redirect).
        // Loader2 usually is an svg.
        expect(mockSetLocation).not.toHaveBeenCalled();
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should render stats when data is loaded", () => {
        (useAuth as Mock).mockReturnValue({
            user: { role: "admin" },
            isLoading: false,
        });

        const mockStats = {
            totalUsers: 100,
            totalReports: 50,
            totalBusinesses: 20,
            recentReports: [],
        };

        (useQuery as Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === "/api/admin/stats") return { data: mockStats, isLoading: false };
            if (queryKey[0] === "/api/admin/usage") return { data: [], isLoading: false };
            if (queryKey[0] === "/api/admin/usage/users") return { data: [], isLoading: false };
            return { data: null, isLoading: false };
        });

        render(<AdminDashboard />);

        expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
        expect(screen.getByText("Total Users")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("50")).toBeInTheDocument();
        expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("should render recent reports table", () => {
        (useAuth as Mock).mockReturnValue({
            user: { role: "admin" },
            isLoading: false,
        });

        const mockReports = [
            { id: "1", businessName: "Biz A", generatedAt: new Date().toISOString() },
        ];

        const mockStats = {
            totalUsers: 0,
            totalReports: 0,
            totalBusinesses: 0,
            recentReports: mockReports,
        };

        (useQuery as Mock).mockImplementation(({ queryKey }) => {
            if (queryKey[0] === "/api/admin/stats") return { data: mockStats, isLoading: false };
            if (queryKey[0] === "/api/admin/usage") return { data: [], isLoading: false };
            if (queryKey[0] === "/api/admin/usage/users") return { data: [], isLoading: false };
            return { data: null, isLoading: false };
        });

        render(<AdminDashboard />);

        expect(screen.getByText("Top Activity")).toBeInTheDocument();
        // Check for count in Top Activity card
        expect(screen.getByText("1")).toBeInTheDocument();

        // Check for new metric cards
        expect(screen.getByText("Conversion Rate")).toBeInTheDocument();
        expect(screen.getByText("Market Density")).toBeInTheDocument();
    });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Footer from "../Footer";
import { useAuth } from "@/hooks/useAuth";

// Mock dependencies
vi.mock("wouter", () => ({
    Link: ({ children, href }: any) => <a href={href}>{children}</a>
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(() => ({ isAuthenticated: false }))
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, opts?: any) => opts?.defaultValue || key
    })
}));

describe("Footer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            user: undefined,
            isLoading: false,
            loginMutation: { mutateAsync: vi.fn() } as any,
            logoutMutation: { mutateAsync: vi.fn() } as any,
            registerMutation: { mutateAsync: vi.fn() } as any
        } as any);
    });

    describe("Base Rendering", () => {
        it("should render footer with logo", () => {
            render(<Footer />);

            const logos = screen.getAllByAltText("Competitor Watcher");
            expect(logos.length).toBeGreaterThan(0);
        });

        it("should render mission statement", () => {
            render(<Footer />);

            expect(screen.getByText(/Empowering local businesses/)).toBeInTheDocument();
        });

        it("should render project section with support link", () => {
            render(<Footer />);

            expect(screen.getByText("Project")).toBeInTheDocument();
            expect(screen.getByText("Support Us")).toBeInTheDocument();
        });

        it("should render legal section links", () => {
            render(<Footer />);

            expect(screen.getByText("Legal")).toBeInTheDocument();
            expect(screen.getByText("legal.privacy.title")).toBeInTheDocument();
            expect(screen.getByText("legal.cookies.title")).toBeInTheDocument();
        });

        it("should render copyright with current year", () => {
            render(<Footer />);

            const currentYear = new Date().getFullYear();
            expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
        });
    });

    describe("Authenticated User", () => {
        beforeEach(() => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: true,
                user: { id: "1", email: "test@example.com" } as any,
                isLoading: false,
                loginMutation: { mutateAsync: vi.fn() } as any,
                logoutMutation: { mutateAsync: vi.fn() } as any,
                registerMutation: { mutateAsync: vi.fn() } as any
            } as any);
        });

        it("should show dashboard link for authenticated users", () => {
            render(<Footer />);

            expect(screen.getByText("Dashboard")).toBeInTheDocument();
        });

        it("should not show login/register links for authenticated users", () => {
            render(<Footer />);

            expect(screen.queryByText("landing.cta.existingAccount")).not.toBeInTheDocument();
        });
    });

    describe("Unauthenticated User", () => {
        it("should show login link for unauthenticated users", () => {
            render(<Footer />);

            expect(screen.getByText("landing.cta.existingAccount")).toBeInTheDocument();
        });

        it("should show register link for unauthenticated users", () => {
            render(<Footer />);

            expect(screen.getByText("auth.signUp")).toBeInTheDocument();
        });

        it("should not show dashboard link for unauthenticated users", () => {
            render(<Footer />);

            expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
        });
    });
});

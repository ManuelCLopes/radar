import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import LandingPage from "../LandingPage";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

// Mock hooks
vi.mock("@/hooks/useAuth");
vi.mock("react-i18next");
vi.mock("wouter", () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
    useLocation: () => ["/", vi.fn()],
}));

// Mock components
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <div>ThemeToggle</div> }));
vi.mock("@/components/LanguageSelector", () => ({ LanguageSelector: () => <div>LanguageSelector</div> }));
vi.mock("@/components/RadiusSelector", () => ({
    RadiusSelector: ({ value, onChange }: { value: number, onChange: (val: number) => void }) => (
        <input
            data-testid="radius-selector"
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
        />
    )
}));
vi.mock("@/components/ReportView", () => ({
    ReportView: ({ open }: { open: boolean }) => open ? <div data-testid="report-modal">Report Modal</div> : null
}));

describe("LandingPage", () => {
    const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
    const mockUseTranslation = useTranslation as unknown as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mocks
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
        });

        mockUseTranslation.mockReturnValue({
            t: (key: string) => key,
        });

        // Mock fetch
        global.fetch = vi.fn();
    });

    it("renders correctly for guest users", () => {
        render(<LandingPage />);
        expect(screen.getByTestId("button-login")).toBeInTheDocument();
    });

    it("renders correctly for authenticated users", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
        });
        render(<LandingPage />);
        expect(screen.queryByTestId("button-login")).not.toBeInTheDocument();
        expect(screen.getByTitle("Dashboard")).toBeInTheDocument();
    });

    it("calls /api/analyze-address for authenticated users", async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ id: "123", businessName: "Test Business" }),
        });

        render(<LandingPage />);

        // Fill form
        const addressInput = screen.getByPlaceholderText("Rua de Belém 84-92, 1300-085 Lisboa");
        fireEvent.change(addressInput, { target: { value: "Test Address" } });

        // Submit
        const submitButton = screen.getByRole("button", { name: /quickSearch.analyzeButton/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/analyze-address", expect.objectContaining({
                method: "POST",
                body: expect.stringContaining("Test Address"),
            }));
        });

        expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    });

    it("calls /api/quick-search for guest users", async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ report: { id: "123", businessName: "Test Business" } }),
        });

        render(<LandingPage />);

        // Fill form
        const addressInput = screen.getByPlaceholderText("Rua de Belém 84-92, 1300-085 Lisboa");
        fireEvent.change(addressInput, { target: { value: "Test Address" } });

        // Submit
        const submitButton = screen.getByRole("button", { name: /quickSearch.analyzeButton/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/quick-search", expect.objectContaining({
                method: "POST",
                body: expect.stringContaining("Test Address"),
            }));
        });

        expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    });
});

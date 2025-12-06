import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LandingPage from "../LandingPage";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

// Mock hooks
vi.mock("@/hooks/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("react-i18next", () => ({
    useTranslation: vi.fn(),
}));

vi.mock("wouter", () => ({
    useLocation: vi.fn(),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock child components
vi.mock("@/components/ThemeToggle", () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

vi.mock("@/components/LanguageSelector", () => ({
    LanguageSelector: () => <div data-testid="language-selector">LanguageSelector</div>,
}));

vi.mock("@/components/RadiusSelector", () => ({
    RadiusSelector: ({ value, onChange }: any) => (
        <input
            data-testid="radius-selector"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            type="number"
        />
    ),
}));

vi.mock("@/components/PreviewReportModal", () => ({
    PreviewReportModal: ({ open, onOpenChange }: any) => (
        open ? (
            <div data-testid="preview-modal">
                Preview Modal
                <button onClick={() => onOpenChange(false)}>Close</button>
            </div>
        ) : null
    ),
}));

vi.mock("embla-carousel-react", () => ({
    default: () => [
        (node: any) => { }, // emblaRef
        {
            scrollPrev: vi.fn(),
            scrollNext: vi.fn(),
            scrollTo: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            scrollSnapList: () => [],
            selectedScrollSnap: () => 0,
            canScrollPrev: () => false,
            canScrollNext: () => false
        } // emblaApi
    ]
}));

describe("LandingPage", () => {
    const t = vi.fn((key) => key);

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: null });
        (useTranslation as any).mockReturnValue({ t, i18n: { language: 'en' } });
        (useLocation as any).mockReturnValue(["/", vi.fn()]);
    });

    it("renders the hero section", () => {
        render(<LandingPage />);
        expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
        expect(screen.getByTestId("hero-subheadline")).toBeInTheDocument();
    });

    it("renders the quick search form and handles interaction", async () => {
        render(<LandingPage />);

        const addressInput = screen.getByPlaceholderText("Rua de Belém 84-92, 1300-085 Lisboa");
        expect(addressInput).toBeInTheDocument();

        fireEvent.change(addressInput, { target: { value: "Test Address" } });
        expect(addressInput).toHaveValue("Test Address");

        const radiusSelector = screen.getByTestId("radius-selector");
        expect(radiusSelector).toBeInTheDocument();

        fireEvent.change(radiusSelector, { target: { value: "2000" } });
        expect(radiusSelector).toHaveValue(2000);

        const searchButton = screen.getByRole("button", { name: /quickSearch/i });
        expect(searchButton).toBeInTheDocument();

        // Note: We are not mocking the API call here, so clicking might trigger an error or do nothing if not mocked.
        // Ideally we should mock the fetch or the function that handles the search if it's extracted.
        // Since the search logic is inside the component, we might need to mock fetch.
    });

    it("renders pricing plans", () => {
        render(<LandingPage />);
        expect(screen.getByTestId("pricing-card-essential")).toBeInTheDocument();
        expect(screen.getByTestId("pricing-card-professional")).toBeInTheDocument();
    });

    it("renders navigation elements", () => {
        render(<LandingPage />);
        expect(screen.getByText("landing.brandName")).toBeInTheDocument();
        expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
        expect(screen.getByTestId("language-selector")).toBeInTheDocument();
        expect(screen.getAllByText("Login")[0]).toBeInTheDocument();
    });
});

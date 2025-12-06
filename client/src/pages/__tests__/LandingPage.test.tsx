import { render, screen, fireEvent } from "@testing-library/react";
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
        />
    ),
}));

vi.mock("@/components/PreviewReportModal", () => ({
    PreviewReportModal: ({ open }: any) => open ? <div data-testid="preview-modal">Preview Modal</div> : null,
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

    it("renders the quick search form", () => {
        render(<LandingPage />);
        // Placeholder is hardcoded
        expect(screen.getByPlaceholderText("Rua de Belém 84-92, 1300-085 Lisboa")).toBeInTheDocument();
        expect(screen.getByTestId("radius-selector")).toBeInTheDocument();
        // Button text might be "quickSearch.analyze" or similar, let's check for button role
        expect(screen.getByRole("button", { name: /quickSearch/i })).toBeInTheDocument();
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
        expect(screen.getAllByText("Login")[0]).toBeInTheDocument(); // Login text is hardcoded or appears multiple times
    });
});

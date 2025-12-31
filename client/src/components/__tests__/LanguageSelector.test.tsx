import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageSelector } from "../LanguageSelector";

// Mock react-i18next
const mockChangeLanguage = vi.fn();
let mockLanguage = "en";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        i18n: {
            language: mockLanguage,
            changeLanguage: mockChangeLanguage,
        },
        t: (key: string) => key,
    }),
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        user: null,
        isLoading: false,
    }),
}));

describe("LanguageSelector", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLanguage = "en";
    });

    it("should handle regional language codes (e.g. pt-BR)", () => {
        mockLanguage = "pt-BR";
        render(<LanguageSelector />);

        // Should show PT
        const badges = screen.getAllByText("PT");
        expect(badges.length).toBeGreaterThan(0);
    });

    it("should render language selector button", () => {
        render(<LanguageSelector />);
        expect(screen.getByTestId("button-language-selector")).toBeInTheDocument();
    });

    it("should open dropdown when clicked", async () => {
        const user = userEvent.setup();
        render(<LanguageSelector />);

        const button = screen.getByTestId("button-language-selector");
        await user.click(button);

        expect(screen.getByText("English")).toBeInTheDocument();
        expect(screen.getByText("Português")).toBeInTheDocument();
        expect(screen.getByText("Español")).toBeInTheDocument();
        expect(screen.getByText("Français")).toBeInTheDocument();
        expect(screen.getByText("Deutsch")).toBeInTheDocument();
    });

    it("should change language when option is selected", async () => {
        const user = userEvent.setup();
        render(<LanguageSelector />);

        const button = screen.getByTestId("button-language-selector");
        await user.click(button);

        const portugueseOption = screen.getByTestId("button-lang-pt");
        await user.click(portugueseOption);

        expect(mockChangeLanguage).toHaveBeenCalledWith("pt");
    });

    it("should show current language badge", () => {
        render(<LanguageSelector />);

        // Badge should show current language (EN in this case)
        const badges = screen.getAllByText("EN");
        expect(badges.length).toBeGreaterThan(0);
    });

    it("should show all language abbreviations in dropdown", async () => {
        const user = userEvent.setup();
        render(<LanguageSelector />);

        const button = screen.getByTestId("button-language-selector");
        await user.click(button);

        // Check all languages are in dropdown (using getAllByText since badge also shows current lang)
        expect(screen.getAllByText("EN").length).toBeGreaterThan(0);
        expect(screen.getAllByText("PT").length).toBeGreaterThan(0);
        expect(screen.getAllByText("ES").length).toBeGreaterThan(0);
        expect(screen.getAllByText("FR").length).toBeGreaterThan(0);
        expect(screen.getAllByText("DE").length).toBeGreaterThan(0);
    });
});

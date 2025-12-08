import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageSelector } from "../LanguageSelector";

// Mock react-i18next
const mockChangeLanguage = vi.fn();
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        i18n: {
            language: "en",
            changeLanguage: mockChangeLanguage,
        },
        t: (key: string) => key,
    }),
}));

describe("LanguageSelector", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it("should show all language abbreviations", async () => {
        const user = userEvent.setup();
        render(<LanguageSelector />);

        const button = screen.getByTestId("button-language-selector");
        await user.click(button);

        expect(screen.getByText("EN")).toBeInTheDocument();
        expect(screen.getByText("PT")).toBeInTheDocument();
        expect(screen.getByText("ES")).toBeInTheDocument();
        expect(screen.getByText("FR")).toBeInTheDocument();
        expect(screen.getByText("DE")).toBeInTheDocument();
    });
});

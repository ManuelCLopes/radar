import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import MarketingPage from "../MarketingPage";
import SampleReportPage from "../SampleReportPage";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false, user: null }),
}));
vi.mock("@/components/LanguageSelector", () => ({ LanguageSelector: () => <div /> }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <div /> }));

function renderAt(path: string, Page: () => JSX.Element | null) {
  const { hook } = memoryLocation({ path, static: true });
  return render(
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <Router hook={hook}>
          <Page />
        </Router>
      </I18nextProvider>
    </HelmetProvider>,
  );
}

describe("MarketingPage", () => {
  it("renders the English local competitor analysis page", () => {
    renderAt("/local-competitor-analysis", MarketingPage);
    expect(screen.getByTestId("marketing-heading")).toHaveTextContent("Local Competitor Analysis");
    expect(screen.getByText("How do I find my local competitors?")).toBeInTheDocument();
  });

  it("renders the Portuguese version under /pt with localized links", () => {
    renderAt("/pt/competitor-tracker", MarketingPage);
    expect(screen.getByTestId("marketing-heading")).toHaveTextContent("Monitorização de Concorrentes");
    expect(screen.getByRole("link", { name: /Exemplo de relatório/ })).toHaveAttribute("href", "/pt/competitor-analysis-report");
  });
});

describe("SampleReportPage", () => {
  it("labels the sample data as fictional", () => {
    renderAt("/competitor-analysis-report", SampleReportPage);
    expect(screen.getByTestId("marketing-heading")).toHaveTextContent("Competitor Analysis Report Example");
    expect(screen.getByTestId("sample-disclaimer")).toHaveTextContent("fictional");
    expect(screen.getAllByText("Grão Fino Café").length).toBeGreaterThan(0);
  });
});

// Build-time entry used by scripts/prerender.ts to render the public marketing
// pages to static HTML, so crawlers get full content without running
// JavaScript. The browser bundle replaces this markup on load (createRoot).
import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PricingModalProvider } from "@/context/PricingModalContext";
import LandingPage from "@/pages/LandingPage";
import MarketingPage from "@/pages/MarketingPage";
import SampleReportPage from "@/pages/SampleReportPage";
import SupportPage from "@/pages/SupportPage";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import { ENGLISH_ONLY_PUBLIC_PATHS, LOCALIZED_PUBLIC_PATHS, getRouteLocale, localizePath, stripLocalePrefix } from "@/lib/localeRoutes";

import enTranslation from "@/i18n/locales/en/common.json";
import ptTranslation from "@/i18n/locales/pt/common.json";

const PAGE_COMPONENTS: Record<string, ComponentType> = {
  "/": LandingPage,
  "/local-competitor-analysis": MarketingPage,
  "/competitor-tracker": MarketingPage,
  "/competitor-analysis-report": SampleReportPage,
  "/support": SupportPage,
  "/privacy-policy": PrivacyPolicy,
  "/cookie-policy": CookiePolicy,
};

export const PRERENDER_ROUTES: string[] = [
  ...LOCALIZED_PUBLIC_PATHS.flatMap((path) => [localizePath(path, "en"), localizePath(path, "pt")]),
  ...ENGLISH_ONLY_PUBLIC_PATHS,
];

export interface PrerenderResult {
  html: string;
  lang: string;
  helmet: HelmetServerState;
}

export async function render(url: string): Promise<PrerenderResult> {
  const lang = getRouteLocale(url);
  const Page = PAGE_COMPONENTS[stripLocalePrefix(url)];
  if (!Page) {
    throw new Error(`No prerender component registered for ${url}`);
  }

  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: enTranslation }, pt: { translation: ptTranslation } },
    lng: lang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Render the logged-out view.
  queryClient.setQueryData(["/api/auth/user"], null);

  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <PricingModalProvider>
              <Router ssrPath={url}>
                <Page />
              </Router>
            </PricingModalProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </HelmetProvider>,
  );

  if (!helmetContext.helmet) {
    throw new Error(`Helmet state was not collected for ${url}`);
  }

  return { html, lang, helmet: helmetContext.helmet };
}

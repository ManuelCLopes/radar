import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { MARKETING_CHROME } from "@/content/marketingPages";
import { getRouteLocale, localizePath, stripLocalePrefix, type RouteLocale } from "@/lib/localeRoutes";

export function useRouteLocale(): RouteLocale {
  const [location] = useLocation();
  return getRouteLocale(location);
}

const RELATED_PAGES = ["/local-competitor-analysis", "/competitor-tracker", "/competitor-analysis-report"] as const;

export function MarketingLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const locale = getRouteLocale(location);
  const chrome = MARKETING_CHROME[locale];
  const currentPath = stripLocalePrefix(location);
  const homeHref = localizePath("/", locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link href={homeHref} className="flex items-center cursor-pointer transition-opacity hover:opacity-80">
            <img src="/logo-dark.png" alt="Competitor Watcher" className="h-10 w-auto dark:hidden" />
            <img src="/logo.png" alt="Competitor Watcher" className="h-10 w-auto hidden dark:block" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <Button asChild size="sm" data-testid="button-marketing-try-free">
              <Link href={homeHref}>{chrome.tryFree}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href={homeHref} className="hover:text-foreground">{chrome.breadcrumbHome}</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page">{chrome.pageNames[currentPath as keyof typeof chrome.pageNames]}</span>
        </nav>

        {children}

        <section className="mt-14 border-t border-gray-200 dark:border-gray-800 pt-8" aria-labelledby="related-pages-heading">
          <h2 id="related-pages-heading" className="text-lg font-semibold mb-4">{chrome.relatedHeading}</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {RELATED_PAGES.filter((path) => path !== currentPath).map((path) => (
              <li key={path}>
                <Link
                  href={localizePath(path, locale)}
                  className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 p-4 text-sm font-medium hover:border-primary transition-colors"
                >
                  {chrome.pageNames[path]} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function MarketingCta({ locale }: { locale: RouteLocale }) {
  const chrome = MARKETING_CHROME[locale];
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-marketing-run-analysis">
        <Link href={localizePath("/", locale)}>{chrome.runAnalysis}</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
        <Link href="/register">{chrome.createAccount}</Link>
      </Button>
    </div>
  );
}

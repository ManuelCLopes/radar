import { Star } from "lucide-react";
import { Seo, toAbsoluteSeoUrl } from "@/components/Seo";
import { MarketingCta, MarketingLayout, useRouteLocale } from "@/components/MarketingLayout";
import { MARKETING_CHROME, SAMPLE_REPORT } from "@/content/marketingPages";
import { localizePath } from "@/lib/localeRoutes";

const PAGE_PATH = "/competitor-analysis-report";

export default function SampleReportPage() {
  const locale = useRouteLocale();
  const report = SAMPLE_REPORT[locale];
  const chrome = MARKETING_CHROME[locale];
  const canonicalPath = localizePath(PAGE_PATH, locale);
  const numberFormat = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US");
  const ratingFormat = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": chrome.breadcrumbHome, "item": toAbsoluteSeoUrl(localizePath("/", locale)) },
      { "@type": "ListItem", "position": 2, "name": chrome.pageNames[PAGE_PATH], "item": toAbsoluteSeoUrl(canonicalPath) },
    ],
  };

  return (
    <MarketingLayout>
      <Seo title={report.seoTitle} description={report.seoDescription} path={canonicalPath} structuredData={structuredData} />

      <article>
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">{report.eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight" data-testid="marketing-heading">{report.h1}</h1>
          <p className="text-lg text-muted-foreground mb-4">{report.intro}</p>
          <p className="inline-block rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 px-3 py-2 text-sm font-medium" data-testid="sample-disclaimer">
            {report.disclaimer}
          </p>
        </header>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-8 space-y-10">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {report.meta.map((item) => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                <dd className="font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h2 className="text-xl font-semibold mb-3">{report.summaryHeading}</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              {report.summary.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{report.tableHeading}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">{report.tableColumns.name}</th>
                    <th scope="col" className="py-2 pr-4 font-medium">{report.tableColumns.rating}</th>
                    <th scope="col" className="py-2 pr-4 font-medium">{report.tableColumns.reviews}</th>
                    <th scope="col" className="py-2 pr-4 font-medium">{report.tableColumns.distance}</th>
                    <th scope="col" className="py-2 font-medium">{report.tableColumns.price}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.competitors.map((competitor) => (
                    <tr
                      key={competitor.name}
                      className={`border-b border-gray-100 dark:border-gray-800 ${competitor.isYou ? "bg-primary/5 font-semibold" : ""}`}
                    >
                      <th scope="row" className="py-2 pr-4 text-left font-medium">
                        {competitor.name}
                        {competitor.isYou && (
                          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] uppercase text-primary-foreground">{report.youLabel}</span>
                        )}
                      </th>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <Star className="inline h-3.5 w-3.5 mr-1 fill-amber-400 text-amber-400" aria-hidden="true" />
                        {ratingFormat.format(competitor.rating)}
                      </td>
                      <td className="py-2 pr-4">{numberFormat.format(competitor.reviews)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{competitor.distance}</td>
                      <td className="py-2">{competitor.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{report.themesHeading}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">{report.positiveThemesLabel}</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">{report.positiveThemes.map((theme) => <li key={theme}>{theme}</li>)}</ul>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">{report.negativeThemesLabel}</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">{report.negativeThemes.map((theme) => <li key={theme}>{theme}</li>)}</ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{report.swotHeading}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {report.swot.map((quadrant) => (
                <div key={quadrant.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold mb-2">{quadrant.label}</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {quadrant.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{report.recommendationsHeading}</h2>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              {report.recommendations.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-3">{report.ctaHeading}</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-5">{report.ctaText}</p>
          <MarketingCta locale={locale} />
        </section>
      </article>
    </MarketingLayout>
  );
}

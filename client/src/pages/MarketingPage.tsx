import { useLocation } from "wouter";
import { Seo, toAbsoluteSeoUrl } from "@/components/Seo";
import { MarketingCta, MarketingLayout } from "@/components/MarketingLayout";
import { MARKETING_CHROME, MARKETING_PAGES, type MarketingPagePath } from "@/content/marketingPages";
import { getRouteLocale, localizePath, stripLocalePrefix } from "@/lib/localeRoutes";

export default function MarketingPage() {
  const [location] = useLocation();
  const locale = getRouteLocale(location);
  const pagePath = stripLocalePrefix(location) as MarketingPagePath;
  const content = MARKETING_PAGES[pagePath]?.[locale];

  if (!content) {
    return null;
  }

  const canonicalPath = localizePath(pagePath, locale);
  const chrome = MARKETING_CHROME[locale];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": chrome.breadcrumbHome, "item": toAbsoluteSeoUrl(localizePath("/", locale)) },
        { "@type": "ListItem", "position": 2, "name": chrome.pageNames[pagePath], "item": toAbsoluteSeoUrl(canonicalPath) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "inLanguage": locale,
      "mainEntity": content.faq.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer },
      })),
    },
  ];

  return (
    <MarketingLayout>
      <Seo title={content.seoTitle} description={content.seoDescription} path={canonicalPath} structuredData={structuredData} />

      <article>
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">{content.eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight" data-testid="marketing-heading">{content.h1}</h1>
          <p className="text-lg text-muted-foreground mb-8">{content.intro}</p>
          <MarketingCta locale={locale} />
        </header>

        {content.sections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{paragraph}</p>
            ))}
            {section.bullets && (
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
            {section.steps && (
              <ol className="space-y-4">
                {section.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        <section className="mb-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-semibold mb-4">{chrome.faqHeading}</h2>
          <div className="space-y-4">
            {content.faq.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 p-4">
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-gray-700 dark:text-gray-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <MarketingCta locale={locale} />
      </article>
    </MarketingLayout>
  );
}

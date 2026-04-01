import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const DEFAULT_BASE_URL = "https://competitorwatcher.pt";
const DEFAULT_SITE_NAME = "Competitor Watcher";
const DEFAULT_IMAGE_PATH = "/logo.png";

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  imagePath?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  structuredData?: StructuredData;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePath(value: string): string {
  if (!value || value === "/") {
    return "";
  }

  return value.startsWith("/") ? value : `/${value}`;
}

export function getSeoBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL;
  if (configuredBaseUrl) {
    return stripTrailingSlash(configuredBaseUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return DEFAULT_BASE_URL;
}

export function toAbsoluteSeoUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${getSeoBaseUrl()}${normalizePath(value)}`;
}

function getLocale(language?: string): string {
  switch (language) {
    case "pt":
      return "pt_PT";
    case "es":
      return "es_ES";
    case "fr":
      return "fr_FR";
    case "de":
      return "de_DE";
    default:
      return "en_US";
  }
}

export function Seo({
  title,
  description,
  path = "/",
  imagePath = DEFAULT_IMAGE_PATH,
  type = "website",
  noIndex = false,
  structuredData,
}: SeoProps) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const canonicalUrl = toAbsoluteSeoUrl(path);
  const imageUrl = toAbsoluteSeoUrl(imagePath);
  const robotsContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large";
  const structuredDataItems = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : [];

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:locale" content={getLocale(language)} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:image" content={imageUrl} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      {description ? <meta property="twitter:description" content={description} /> : null}
      <meta property="twitter:image" content={imageUrl} />
      {structuredDataItems.map((entry, index) => (
        <script key={`seo-structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}

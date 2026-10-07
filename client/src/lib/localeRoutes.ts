// Public marketing routes that exist in an English (unprefixed) and a
// Portuguese (/pt-prefixed) version. These are the routes we prerender and
// list in the sitemap with hreflang alternates.
export const LOCALIZED_PUBLIC_PATHS = [
  "/",
  "/local-competitor-analysis",
  "/competitor-tracker",
  "/competitor-analysis-report",
] as const;

// Public pages that only exist in English; prerendered but without a /pt twin.
export const ENGLISH_ONLY_PUBLIC_PATHS = ["/support", "/privacy-policy", "/cookie-policy"] as const;

export type LocalizedPublicPath = (typeof LOCALIZED_PUBLIC_PATHS)[number];
export type RouteLocale = "en" | "pt";

export const PT_PREFIX = "/pt";

function normalize(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] || "/";
  const trimmed = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
  return trimmed || "/";
}

export function getRouteLocale(path: string): RouteLocale {
  const normalized = normalize(path);
  return normalized === PT_PREFIX || normalized.startsWith(`${PT_PREFIX}/`) ? "pt" : "en";
}

/** Removes the /pt prefix, returning the English path. */
export function stripLocalePrefix(path: string): string {
  const normalized = normalize(path);
  if (getRouteLocale(normalized) !== "pt") {
    return normalized;
  }
  return normalized.slice(PT_PREFIX.length) || "/";
}

export function isLocalizedPublicPath(path: string): boolean {
  return (LOCALIZED_PUBLIC_PATHS as readonly string[]).includes(stripLocalePrefix(path));
}

/** Returns the URL path for `path` (an English path) in the given locale. */
export function localizePath(path: string, locale: RouteLocale): string {
  const base = stripLocalePrefix(path);
  if (locale !== "pt") {
    return base;
  }
  return base === "/" ? PT_PREFIX : `${PT_PREFIX}${base}`;
}

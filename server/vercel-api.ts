const API_PREFIX = "/api";

export function restoreApiPathFromRewrite(inputUrl: string | undefined): string {
  const fallbackUrl = API_PREFIX;
  const parsedUrl = new URL(inputUrl || fallbackUrl, "http://localhost");
  const rewrittenPath = parsedUrl.searchParams.get("path");

  if (rewrittenPath === null) {
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  }

  const normalizedPath = rewrittenPath.replace(/^\/+/, "");
  const restoredPath = normalizedPath ? `${API_PREFIX}/${normalizedPath}` : API_PREFIX;

  parsedUrl.searchParams.delete("path");

  const remainingQuery = parsedUrl.searchParams.toString();
  return remainingQuery ? `${restoredPath}?${remainingQuery}` : restoredPath;
}

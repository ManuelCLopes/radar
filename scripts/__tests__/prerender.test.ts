// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPageHtml, outputFileForRoute } from "../prerender";
import { LOCALIZED_PUBLIC_PATHS, localizePath } from "../../client/src/lib/localeRoutes";

const rootDir = path.resolve(__dirname, "..", "..");
const routes = LOCALIZED_PUBLIC_PATHS.flatMap((p) => [localizePath(p, "en"), localizePath(p, "pt")]);

describe("prerender", () => {
  it("maps routes to output files", () => {
    expect(outputFileForRoute("/")).toBe("index.html");
    expect(outputFileForRoute("/pt")).toBe("pt.html");
    expect(outputFileForRoute("/pt/competitor-tracker")).toBe("pt/competitor-tracker.html");
  });

  it("replaces the shell SEO tags with the page's own head and markup", () => {
    const template = fs.readFileSync(path.join(rootDir, "client", "index.html"), "utf8");
    const output = buildPageHtml(template, {
      lang: "pt",
      head: '<title>Página</title><link rel="canonical" href="https://competitorwatcher.pt/pt"/>',
      html: "<h1>Olá</h1>",
    });

    expect(output).toContain('<html lang="pt">');
    expect(output.match(/<title>/g)).toHaveLength(1);
    expect(output).toContain("<title>Página</title>");
    expect(output.match(/rel="canonical"/g)).toHaveLength(1);
    expect(output).not.toContain("application/ld+json");
    expect(output).not.toContain('property="og:');
    expect(output).toContain('<div id="root"><h1>Olá</h1></div>');
    // Non-SEO head content (icons, fonts, scripts) is kept.
    expect(output).toContain('rel="icon"');
    expect(output).toContain('src="/src/main.tsx"');
  });

  it("has a Vercel rewrite for every prerendered route before the SPA fallback", () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(rootDir, "vercel.json"), "utf8"));
    const rewrites: { source: string; destination: string }[] = vercel.rewrites;
    const fallbackIndex = rewrites.findIndex((rewrite) => rewrite.destination === "/app.html");
    expect(fallbackIndex).toBeGreaterThan(-1);

    for (const route of routes) {
      const index = rewrites.findIndex((rewrite) => rewrite.source === route);
      expect(index, route).toBeGreaterThan(-1);
      expect(index, route).toBeLessThan(fallbackIndex);
      expect(rewrites[index].destination).toBe(`/${outputFileForRoute(route)}`);
    }
  });

  it("lists every prerendered route in the sitemap", () => {
    const sitemap = fs.readFileSync(path.join(rootDir, "client", "public", "sitemap.xml"), "utf8");
    for (const route of routes) {
      const url = route === "/" ? "https://competitorwatcher.pt/" : `https://competitorwatcher.pt${route}`;
      expect(sitemap, route).toContain(`<loc>${url}</loc>`);
    }
  });
});

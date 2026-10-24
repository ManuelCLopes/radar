// Renders the public marketing pages to static HTML after `vite build`.
//
// Output (in dist/public):
//   app.html                  untouched SPA shell, served for every other route
//   index.html                prerendered "/"
//   <route>.html              prerendered page for each other public route
//
// vercel.json rewrites each prerendered route to its file and everything else
// to app.html.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const rootDir = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(rootDir, "dist", "public");
const ssrOutDir = path.join(rootDir, "dist", "prerender");
const leafletStub = path.join(rootDir, "client", "src", "prerender", "leaflet-stub.ts");

interface HelmetDatum {
  toString(): string;
}

interface PrerenderModule {
  PRERENDER_ROUTES: string[];
  render(url: string): Promise<{
    html: string;
    lang: string;
    helmet: Record<"title" | "meta" | "link" | "script", HelmetDatum>;
  }>;
}

// Head tags the page sets itself through <Seo>; the shell's defaults are
// removed so each prerendered page has exactly one of each.
const SHELL_SEO_TAG_PATTERNS = [
  /<title>[\s\S]*?<\/title>\s*/i,
  /<meta\s+name="(?:description|keywords|robots|googlebot)"[^>]*>\s*/gi,
  /<meta\s+(?:name|property)="(?:og|twitter):[^"]+"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/gi,
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
];

export function buildPageHtml(
  template: string,
  page: { html: string; lang: string; head: string },
): string {
  let output = template;
  for (const pattern of SHELL_SEO_TAG_PATTERNS) {
    output = output.replace(pattern, "");
  }

  if (!output.includes('<div id="root"></div>')) {
    throw new Error('Template is missing <div id="root"></div>');
  }

  return output
    .replace(/<html lang="[^"]*">/, `<html lang="${page.lang}">`)
    .replace("</head>", `${page.head}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${page.html}</div>`);
}

export function outputFileForRoute(route: string): string {
  return route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`;
}

export async function prerender(): Promise<void> {
  const templatePath = path.join(publicDir, "index.html");
  const shellPath = path.join(publicDir, "app.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing ${templatePath}; run vite build first`);
  }

  // Keep the empty SPA shell for client-only routes before index.html is
  // overwritten with the prerendered homepage. Re-running reuses the shell.
  if (!fs.existsSync(shellPath)) {
    fs.copyFileSync(templatePath, shellPath);
  }
  const template = fs.readFileSync(shellPath, "utf8");

  await build({
    configFile: path.join(rootDir, "vite.config.ts"),
    logLevel: "warn",
    resolve: {
      alias: [
        { find: /^leaflet$/, replacement: leafletStub },
        { find: /^react-leaflet$/, replacement: leafletStub },
      ],
    },
    // Bundle dependencies too: several are CommonJS packages whose named
    // exports Node's ESM loader can't see when left external.
    ssr: { noExternal: true },
    build: {
      ssr: "src/entry-prerender.tsx",
      outDir: ssrOutDir,
      emptyOutDir: true,
      copyPublicDir: false,
    },
  });

  const entry = path.join(ssrOutDir, "entry-prerender.js");
  const mod = (await import(pathToFileURL(entry).href)) as PrerenderModule;

  for (const route of mod.PRERENDER_ROUTES) {
    const { html, lang, helmet } = await mod.render(route);
    const head = [helmet.title, helmet.meta, helmet.link, helmet.script]
      .map((datum) => datum.toString())
      .filter(Boolean)
      .join("\n    ");
    const outFile = path.join(publicDir, outputFileForRoute(route));
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, buildPageHtml(template, { html, lang, head }));
    console.log(`prerendered ${route} -> ${path.relative(rootDir, outFile)}`);
  }

  fs.rmSync(ssrOutDir, { recursive: true, force: true });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  prerender().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

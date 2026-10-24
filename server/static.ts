import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Prerendered marketing pages are written as <route>.html (see
  // scripts/prerender.ts); serve them at their extensionless URL.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const routePath = req.path.replace(/\/+$/, "");
    if (!routePath || routePath.includes(".")) return next();
    const prerenderedFile = path.resolve(distPath, `.${routePath}.html`);
    if (!prerenderedFile.startsWith(distPath + path.sep) || !fs.existsSync(prerenderedFile)) return next();
    res.sendFile(prerenderedFile);
  });

  app.use(express.static(distPath));

  // fall through to the SPA shell if the file doesn't exist
  const shellFile = fs.existsSync(path.resolve(distPath, "app.html")) ? "app.html" : "index.html";
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, shellFile));
  });
}

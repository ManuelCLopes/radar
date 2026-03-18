import { createConfiguredServer } from "../server/bootstrap.js";
import { restoreApiPathFromRewrite } from "../server/vercel-api.js";
import type { Express } from "express";

let appPromise: Promise<Express> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createConfiguredServer({
      runtime: "serverless",
      runSeed: false,
      runMigrations: process.env.RUN_MIGRATIONS_ON_BOOT === "true",
      startScheduler: false,
    }).then(({ app }) => app);
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  // Vercel rewrites `/api/:path*` to `/api?path=...`; restore the original URL
  // so the Express router continues to match the existing `/api/...` routes.
  req.url = restoreApiPathFromRewrite(req.url);

  const app = await getApp();
  return app(req, res);
}

import { createConfiguredServer } from "../server/bootstrap";
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
  const app = await getApp();
  return app(req, res);
}

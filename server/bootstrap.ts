import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { log } from "./log";
import { seed } from "./seed";
import { initSentry } from "./sentry";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let sentryInitialized = false;

export interface BootstrapOptions {
  runtime?: "standalone" | "serverless";
  runMigrations?: boolean;
  runSeed?: boolean;
  startScheduler?: boolean;
}

export async function createConfiguredServer(options: BootstrapOptions = {}) {
  const runtime = options.runtime ?? "standalone";

  if (!sentryInitialized) {
    initSentry();
    sentryInitialized = true;
  }

  const app = express();
  const httpServer = createServer(app);

  app.set("trust proxy", 1);

  // Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );

  // CORS configuration
  if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS) {
    log("WARNING: ALLOWED_ORIGINS is not set in production. CORS is open to all origins.");
  }

  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : true,
      credentials: true,
    }),
  );

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: unknown;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse !== undefined) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  const shouldRunSeed = options.runSeed ?? process.env.NODE_ENV !== "production";
  if (shouldRunSeed) {
    await seed();
  }

  const shouldRunMigrations =
    options.runMigrations ??
    (runtime === "standalone" &&
      process.env.NODE_ENV === "production" &&
      process.env.RUN_MIGRATIONS_ON_BOOT !== "false");

  if (shouldRunMigrations) {
    const { runMigrations } = await import("./migrate");
    await runMigrations();
  }

  const shouldStartScheduler =
    options.startScheduler ??
    (runtime === "standalone" && process.env.DISABLE_INTERNAL_SCHEDULER !== "true");

  await registerRoutes(httpServer, app, { startScheduler: shouldStartScheduler });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });

    if (runtime === "standalone") {
      throw err;
    }
  });

  return { app, httpServer };
}

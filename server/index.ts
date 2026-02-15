import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { log } from "./log";
import { initSentry } from "./sentry";
import cors from "cors";
import helmet from "helmet";

initSentry();


const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.set("trust proxy", 1);

// Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false, // Disable CSP in dev for Vite HMR
}));

// CORS configuration
if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS) {
  log("WARNING: ALLOWED_ORIGINS is not set in production. CORS is open to all origins.");
}

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : true,
  credentials: true,
}));

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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

import { seed } from "./seed";

(async () => {
  // Run seeding in development environment
  if (process.env.NODE_ENV !== "production") {
    await seed();
  }

  // Run migrations in production (and dev if needed, but dev usually uses db:push)
  // However, relying on migrations is safer for all envs if we have them.
  // For now, let's run them if we have them.
  // Note: We need to handle the case where migrations folder might be different in dev/prod if we run source vs dist.
  // The build script copies to dist/migrations. 
  // In dev (tsx), we might point to "migrations".
  // But our migrate.ts points to "dist/migrations". 
  // Let's adjust migrate.ts to be smarter or just run in prod for now as requested.

  if (process.env.NODE_ENV === "production") {
    const { runMigrations } = await import("./migrate");
    await runMigrations();
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

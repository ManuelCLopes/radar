import type { Express } from "express";
import { type Server } from "http";
import { setupAuth } from "../auth";
import { log } from "../log";
import { startScheduler } from "../scheduler";

import { registerAuthRoutes } from "./auth";
import { registerBusinessRoutes } from "./businesses";
import { registerReportRoutes } from "./reports";
import { registerSearchRoutes } from "./search";
import { registerSchedulerRoutes } from "./scheduler";
import { registerUserRoutes } from "./users";
import { registerAdminRoutes } from "./admin";
import { registerStaticRoutes } from "./static";

export async function registerRoutes(
    httpServer: Server,
    app: Express
): Promise<Server> {
    log("Registering routes...", "express");

    // Setup authentication (Google OAuth + Email/Password)
    await setupAuth(app);

    // Register modular routes
    registerAuthRoutes(app);
    registerBusinessRoutes(app);
    registerReportRoutes(app);
    registerSearchRoutes(app);
    registerSchedulerRoutes(app);
    registerUserRoutes(app);
    registerAdminRoutes(app);
    registerStaticRoutes(app);

    // Start background scheduler
    startScheduler();

    return httpServer;
}

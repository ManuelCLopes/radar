import type { Express } from "express";
import { type Server } from "http";
import { setupAuth } from "../auth.js";
import { log } from "../log.js";
import { startScheduler } from "../scheduler.js";

import { registerAuthRoutes } from "./auth.js";
import { registerBusinessRoutes } from "./businesses.js";
import { registerReportRoutes } from "./reports.js";
import { registerSearchRoutes } from "./search.js";
import { registerSchedulerRoutes } from "./scheduler.js";
import { registerUserRoutes } from "./users.js";
import { registerAdminRoutes } from "./admin.js";
import { registerStaticRoutes } from "./static.js";
import { registerPaymentRoutes } from "./payments.js";
import { registerTrendRoutes } from "./trends.js";

interface RegisterRoutesOptions {
    startScheduler?: boolean;
}

export async function registerRoutes(
    httpServer: Server,
    app: Express,
    options: RegisterRoutesOptions = {}
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
    registerPaymentRoutes(app);
    registerTrendRoutes(app);
    registerStaticRoutes(app);

    if (options.startScheduler ?? true) {
        startScheduler();
    }

    return httpServer;
}

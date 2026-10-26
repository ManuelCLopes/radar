import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db, pool } from "./db.js";

export async function runMigrations(migrationsFolder = "dist/migrations") {
    if (!db || !pool) {
        console.warn("Database connection not available, skipping migrations");
        return;
    }

    console.log("Running database migrations...");
    try {
        // This will run migrations on the database, skipping the ones already applied
        await migrate(db, { migrationsFolder });
        console.log("Migrations completed successfully");
    } catch (error) {
        console.error("Error running migrations:", error);
        // Determine if we should exit or continue. 
        // Usually, if migrations fail, the app might be broken, so throwing is safer.
        throw error;
    }
}

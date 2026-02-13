import { defineConfig } from "drizzle-kit";

console.log("Checking environment variables in drizzle.config.ts:");
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("DEV_DATABASE_URL present:", !!process.env.DEV_DATABASE_URL);

const databaseUrl = process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DEV_DATABASE_URL must be set. Ensure the database is provisioned.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

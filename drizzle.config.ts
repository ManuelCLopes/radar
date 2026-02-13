import { defineConfig } from "drizzle-kit";

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

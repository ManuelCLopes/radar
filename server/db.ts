import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL or DEV_DATABASE_URL must be set. Did you forget to provision a database?\nUsing memory storage instead.",
  );
}

export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
export const db = pool ? drizzle({ client: pool, schema }) : null;

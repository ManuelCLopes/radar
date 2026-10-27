// Applies pending Drizzle migrations from ./migrations. Run during production
// builds (scripts/vercel-build.sh) so the schema is updated before new code
// that depends on it goes live.
import { runMigrations } from "../server/migrate.js";
import { pool } from "../server/db.js";

try {
    await runMigrations("migrations");
} finally {
    await pool?.end();
}

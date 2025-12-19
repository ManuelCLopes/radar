
import 'dotenv/config';
import { pool } from "../server/db";
import * as fs from 'fs';

async function run() {
    try {
        if (!pool) {
            fs.writeFileSync('migration_status.txt', 'FAILURE: No database connection (pool is null)');
            process.exit(1);
        }
        console.log("Adding radius column...");
        await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS radius INTEGER;');
        fs.writeFileSync('migration_status.txt', 'SUCCESS');
        console.log("Migration successful");
    } catch (error) {
        fs.writeFileSync('migration_status.txt', 'FAILURE: ' + error);
        console.error("Migration failed:", error);
    } finally {
        if (pool) await pool.end();
    }
}

run();

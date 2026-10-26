import { storage } from "./storage.js";
import type { InsertSearch } from "../shared/schema.js";

// Feeds the admin activity view. Tracking is best-effort: a failure here must
// never fail the analysis the user asked for.
export async function recordSearch(search: InsertSearch): Promise<void> {
    try {
        await storage.trackSearch?.(search);
    } catch (error) {
        console.error("Failed to record search:", error);
    }
}

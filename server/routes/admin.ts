import { type Express } from "express";
import { storage } from "../storage.js";
import { buildAdminOverview, buildApiUsageSummary } from "../adminStats.js";
import { toSafeUser } from "../safeUser.js";

const USAGE_PERIOD_DAYS = 30;

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};

export function registerAdminRoutes(app: Express) {
    app.get("/api/admin/overview", isAdmin, async (req, res) => {
        try {
            const rows = await storage.getAdminOverviewRows();
            res.json(buildAdminOverview(rows));
        } catch (err) {
            console.error("Error building admin overview:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/users", isAdmin, async (req, res) => {
        try {
            const users = await storage.listUsers();
            res.json(users.map(toSafeUser));
        } catch (err) {
            console.error("Error listing users:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/billing-waitlist", isAdmin, async (req, res) => {
        try {
            const leads = await storage.listBillingWaitlistLeads();
            res.json(leads);
        } catch (err) {
            console.error("Error listing billing waitlist:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
        try {
            const { role } = req.body;
            if (role !== "admin" && role !== "user") {
                return res.status(400).json({ message: "Invalid role" });
            }
            // Demoting yourself could leave the app without any admin.
            if (req.params.id === (req.user as any)?.id && role !== "admin") {
                return res.status(400).json({ message: "Cannot remove your own admin role" });
            }
            const user = await storage.getUser(req.params.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            await storage.updateUser(req.params.id, { role });
            res.json({ message: "Role updated" });
        } catch (err) {
            console.error("Error updating user role:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
        try {
            const userId = (req.user as any)?.id;
            // Prevent deleting self
            if (userId === req.params.id) {
                return res.status(400).json({ message: "Cannot delete yourself" });
            }
            await storage.deleteUser(req.params.id);
            res.sendStatus(200);
        } catch (err) {
            console.error("Error deleting user:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/searches", isAdmin, async (req, res) => {
        try {
            if (storage.listRecentSearches) {
                const searches = await storage.listRecentSearches();
                res.json(searches);
            } else {
                res.json([]);
            }
        } catch (err) {
            console.error("Error listing searches:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/usage", isAdmin, async (req, res) => {
        try {
            const since = new Date(Date.now() - USAGE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
            const rows = await storage.listApiUsageSince(since);
            res.json(buildApiUsageSummary(rows, { days: USAGE_PERIOD_DAYS }));
        } catch (err) {
            console.error("Error fetching usage stats:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/usage/users", isAdmin, async (req, res) => {
        try {
            const requested = parseInt(req.query.limit as string, 10);
            const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 100) : 10;
            const stats = await storage.getApiUsageByUser(limit);
            res.json(stats);
        } catch (err) {
            console.error("Error fetching usage by user:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
}

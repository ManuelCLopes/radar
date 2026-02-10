import { type Express } from "express";
import { storage } from "../storage";

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};

export function registerAdminRoutes(app: Express) {
    app.get("/api/admin/stats", isAdmin, async (req, res) => {
        try {
            const businesses = await storage.listBusinesses();
            const reports = await storage.listAllReports();
            const users = await storage.listUsers();

            res.json({
                totalUsers: users.length,
                totalBusinesses: businesses.length,
                totalReports: reports.length,
                recentReports: reports.slice(0, 5),
            });
        } catch (err) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/users", isAdmin, async (req, res) => {
        try {
            const users = await storage.listUsers();
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
        try {
            const { role } = req.body;
            if (role !== "admin" && role !== "user") {
                return res.status(400).json({ message: "Invalid role" });
            }
            const user = await storage.getUser(req.params.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            await storage.updateUser(req.params.id, { role });
            res.json({ message: "Role updated" });
        } catch (err) {
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
            res.status(500).json({ message: "Internal Server Error" });
        }
    });



    app.get("/api/admin/analytics", isAdmin, async (req, res) => {
        try {
            const users = await storage.listUsers();
            const reports = await storage.listAllReports();

            // Prepare simple time-series data (grouped by date)
            const last30Days = [...Array(30)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split("T")[0];
            }).reverse();

            const userGrowth = last30Days.map(date => ({
                date,
                count: users.filter(u => u.createdAt && u.createdAt.toISOString().startsWith(date)).length
            }));

            const reportStats = last30Days.map(date => ({
                date,
                count: reports.filter(r => r.generatedAt.toISOString().startsWith(date)).length
            }));

            // Get extended insights
            let searchStats = {};
            if (storage.getSearchStats) {
                searchStats = await storage.getSearchStats();
            }

            res.json({ userGrowth, reportStats, ...searchStats });
        } catch (err) {
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
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/usage", isAdmin, async (req, res) => {
        try {
            const stats = await storage.getApiUsageStats(30);
            res.json(stats);
        } catch (err) {
            console.error("Error fetching usage stats:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    app.get("/api/admin/usage/users", isAdmin, async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const stats = await storage.getApiUsageByUser(limit);
            res.json(stats);
        } catch (err) {
            console.error("Error fetching usage by user:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });
}

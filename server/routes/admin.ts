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
}

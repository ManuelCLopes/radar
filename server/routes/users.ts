import type { Express } from "express";
import { storage } from "../storage";
import { type User as AppUser } from "@shared/schema";
import { isAuthenticated } from "../auth";

export function registerUserRoutes(app: Express) {
    // Account Deletion
    app.delete("/api/user", isAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as AppUser).id;
            await storage.deleteUser(userId);

            req.logout((err) => {
                if (err) {
                    console.error("Error logging out after account deletion:", err);
                    return res.status(500).json({ error: "Account deleted but failed to log out" });
                }
                res.json({ message: "Account deleted successfully" });
            });
        } catch (error) {
            console.error("Error deleting account:", error);
            res.status(500).json({ error: "Failed to delete account" });
        }
    });

    // Update user language preference
    app.post("/api/user/language", isAuthenticated, async (req, res) => {
        try {
            const { language } = req.body;
            if (!language) {
                return res.status(400).json({ error: "Language is required" });
            }

            await storage.updateUserLanguage((req.user as any).id, language);

            res.json({ success: true });
        } catch (error) {
            console.error("Failed to update language:", error);
            res.status(500).json({ error: "Failed to update language" });
        }
    });
}

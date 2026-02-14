
import type { Express } from "express";
import { storage } from "../storage";
import { type User as AppUser } from "@shared/schema";
import { isAuthenticated } from "../auth";
import bcrypt from "bcrypt";

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

    // Update user profile (Name, Email)
    app.patch("/api/user", isAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as AppUser).id;
            const { firstName, lastName, email } = req.body;

            // Basic validation
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: "Invalid email format" });
            }

            // Check email existence if email is being changed
            if (email && email.toLowerCase() !== (req.user as AppUser).email.toLowerCase()) {
                const existingUser = await storage.getUserByEmail(email);
                if (existingUser) {
                    return res.status(409).json({ error: "Email already exists" });
                }
            }

            const updatedUser = await storage.updateUser(userId, {
                firstName: firstName || (req.user as AppUser).firstName,
                lastName: lastName || (req.user as AppUser).lastName,
                email: email || (req.user as AppUser).email,
            });

            // Re-login to update session
            req.login(updatedUser, (err) => {
                if (err) {
                    console.error("Error re-logging in after update:", err);
                    return res.status(500).json({ error: "Profile updated but session refresh failed" });
                }
                res.json({ user: updatedUser });
            });

        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ error: "Failed to update profile" });
        }
    });

    // Change Password
    app.post("/api/user/password", isAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as AppUser).id;
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const user = req.user as AppUser;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ error: "All fields are required" });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ error: "Passwords do not match" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Password must be at least 6 characters" });
            }

            // Safety check for Google users without password
            if (!user.passwordHash) {
                return res.status(400).json({ error: "Google accounts cannot change password. Only local accounts." });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return res.status(401).json({ error: "Incorrect current password" });
            }

            // Hash new password
            const SALT_ROUNDS = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

            await storage.updateUserPassword(userId, newPasswordHash);

            res.json({ message: "Password updated successfully" });

        } catch (error) {
            console.error("Error changing password:", error);
            res.status(500).json({ error: "Failed to change password" });
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

    // GDPR: Data export (Right to Data Portability)
    app.get("/api/user/export", isAuthenticated, async (req, res) => {
        try {
            const userId = (req.user as AppUser).id;
            const user = await storage.getUser(userId);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const [businesses, reports, searches, apiUsage] = await Promise.all([
                storage.listBusinesses(userId),
                storage.getReportsByUserId(userId),
                storage.listSearchesByUserId(userId),
                storage.listApiUsageByUserId(userId),
            ]);

            const {
                passwordHash,
                verificationToken,
                verificationTokenExpiresAt,
                ...safeUser
            } = user;

            const exportPayload = {
                exportedAt: new Date().toISOString(),
                user: safeUser,
                businesses,
                reports,
                searches,
                apiUsage,
            };

            const filename = `competitor-watcher-data-${new Date().toISOString().slice(0, 10)}.json`;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.send(JSON.stringify(exportPayload, null, 2));
        } catch (error) {
            console.error("Error exporting user data:", error);
            res.status(500).json({ error: "Failed to export user data" });
        }
    });
}

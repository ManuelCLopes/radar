import type { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";

export function registerAuthRoutes(app: Express) {
    // Password reset routes
    app.post("/api/auth/forgot-password", async (req, res) => {
        try {
            const { email, language } = req.body;
            const normalizedEmail = email?.toLowerCase();

            if (!normalizedEmail) {
                return res.status(400).json({ error: "Email is required" });
            }

            const { sendEmail, generatePasswordResetEmail } = await import("../email");
            const crypto = await import("crypto");

            log(`Password Reset Request received for: ${email}`, "auth");

            // Find user by email
            const user = await storage.findUserByEmail(email);

            // Always return success to prevent email enumeration
            if (!user) {
                log(`Password Reset: User not found for email: ${email}`, "auth");
                return res.json({ message: "If that email exists, a reset link has been sent." });
            }

            log(`Password Reset: User ${user.id} found. Attempting email...`, "auth");

            const userLang = language || user.language || "pt";

            // Generate secure token
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Store token in database
            await storage.createPasswordResetToken({
                userId: user.id,
                token,
                expiresAt,
            });

            // Generate reset link
            const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${token}`;

            // Send email
            const { html, text } = generatePasswordResetEmail(resetLink, email, userLang);

            const subjects: Record<string, string> = {
                pt: "Recuperação de Password - Competitor Watcher",
                en: "Password Recovery - Competitor Watcher",
                es: "Recuperación de contraseña - Competitor Watcher",
                fr: "Récupération de mot de passe - Competitor Watcher",
                de: "Passwort-Wiederherstellung - Competitor Watcher"
            };

            await sendEmail({
                to: email,
                subject: subjects[userLang] || subjects.en,
                html,
                text,
            });

            res.json({ message: "If that email exists, a reset link has been sent." });
        } catch (error: any) {
            console.error("[Password Reset] Error:", error);
            res.status(500).json({ error: "Failed to process password reset request" });
        }
    });

    app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
        try {
            const { token } = req.params;

            const resetToken = await storage.getPasswordResetToken(token);

            if (!resetToken) {
                return res.status(400).json({ valid: false, error: "Invalid or expired token" });
            }

            if (resetToken.used) {
                return res.status(400).json({ valid: false, error: "Token already used" });
            }

            if (new Date() > new Date(resetToken.expiresAt)) {
                return res.status(400).json({ valid: false, error: "Token expired" });
            }

            res.json({ valid: true });
        } catch (error: any) {
            console.error("[Verify Token] Error:", error);
            res.status(500).json({ valid: false, error: "Failed to verify token" });
        }
    });

    app.post("/api/auth/reset-password", async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ error: "Token and password are required" });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: "Password must be at least 8 characters" });
            }

            const resetToken = await storage.getPasswordResetToken(token);

            if (!resetToken) {
                return res.status(400).json({ error: "Invalid or expired token" });
            }

            if (resetToken.used) {
                return res.status(400).json({ error: "Token already used" });
            }

            if (new Date() > new Date(resetToken.expiresAt)) {
                return res.status(400).json({ error: "Token expired" });
            }

            // Update password
            const bcrypt = await import("bcrypt");
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await storage.updateUserPassword(resetToken.userId, hashedPassword);

            // Mark token as used
            await storage.markTokenAsUsed(token);

            res.json({ message: "Password reset successful" });
        } catch (error: any) {
            console.error("[Reset Password] Error:", error);
            res.status(500).json({ error: "Failed to reset password" });
        }
    });
}

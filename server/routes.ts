import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runReportForBusiness } from "./reports";
import { startScheduler, getSchedulerStatus, runScheduledReports } from "./scheduler";
import { searchPlacesByAddress, hasGoogleApiKey } from "./googlePlaces";
import { eq, desc } from "drizzle-orm";
import { businesses, reports, users, searches, passwordResetTokens } from "@shared/schema";
import { db } from "./db";
import { type InsertBusiness, insertBusinessSchema, type User as AppUser } from "@shared/schema";


import { setupAuth, isAuthenticated } from "./auth";
import { log } from "./log";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  log("Registering routes...", "express");

  // Setup authentication (Google OAuth + Email/Password)
  await setupAuth(app);

  // Quick Search endpoint (no authentication required, rate limited)
  // Simple in-memory rate limiting (5 searches per IP per hour)
  const searchCounts = new Map<string, { count: number; resetTime: number }>();

  app.post("/api/quick-search", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      // Rate limiting check
      const rateLimit = searchCounts.get(clientIp);
      if (rateLimit) {
        if (now < rateLimit.resetTime) {
          if (rateLimit.count >= 5) {
            return res.status(429).json({
              error: "Rate limit exceeded",
              message: "Too many searches. Create a free account for unlimited searches.",
              resetTime: rateLimit.resetTime
            });
          }
          rateLimit.count++;
        } else {
          // Reset after 1 hour
          searchCounts.set(clientIp, { count: 1, resetTime: now + 60 * 60 * 1000 });
        }
      } else {
        searchCounts.set(clientIp, { count: 1, resetTime: now + 60 * 60 * 1000 });
      }

      const { address, type, radius, language = 'en' } = req.body;

      if (!address || !type || !radius) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Address, type, and radius are required"
        });
      }

      // Validate radius
      const validRadii = [500, 1000, 2000, 5000];
      if (!validRadii.includes(radius)) {
        return res.status(400).json({
          error: "Invalid radius",
          message: "Radius must be one of: 500, 1000, 2000, 5000 meters"
        });
      }

      // Search for the address to get coordinates
      let coordinates = null;
      if (hasGoogleApiKey()) {
        const searchResults = await searchPlacesByAddress(address);
        if (searchResults && searchResults.length > 0) {
          coordinates = {
            latitude: searchResults[0].latitude,
            longitude: searchResults[0].longitude
          };
        }
      }

      if (!coordinates) {
        return res.status(400).json({
          error: "Address not found",
          message: "Could not find coordinates for the provided address"
        });
      }

      // Create temporary business object for report generation
      const tempBusiness = {
        id: 'temp-' + Date.now(),
        name: address,
        type,
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationStatus: 'validated' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null // Temp business has no user
      };

      // Generate report (this will use existing report logic)
      const report = await runReportForBusiness(tempBusiness.id, language, tempBusiness, undefined, radius);

      // Return full report for the free preview (limit 1 per user handled on client)
      // Inject business details so they can be saved later
      const reportWithBusiness = {
        ...report,
        type: tempBusiness.type,
        address: tempBusiness.address,
        latitude: tempBusiness.latitude,
        longitude: tempBusiness.longitude
      };

      res.json({
        report: reportWithBusiness,
        searchId: 'temp-' + Date.now()
      });
    } catch (error) {
      console.error("Error in quick search:", error);
      res.status(500).json({ error: "Failed to perform search" });
    }
  });

  // Protected API routes
  app.get("/api/businesses", isAuthenticated, async (req, res) => {
    try {
      const businesses = await storage.listBusinesses((req.user as AppUser).id);
      res.json(businesses);
    } catch (error) {
      console.error("Error listing businesses:", error);
      res.status(500).json({ error: "Failed to list businesses" });
    }
  });

  app.post("/api/businesses", isAuthenticated, async (req, res) => {
    try {
      const validationResult = insertBusinessSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.flatten()
        });
      }

      const data = validationResult.data;

      const lat = data.latitude;
      const lng = data.longitude;
      const locationStatus = data.locationStatus || "validated";

      if (locationStatus === "validated") {
        if (lat === undefined || lat === null || lng === undefined || lng === null) {
          return res.status(400).json({
            error: "Location coordinates are required for validated businesses. Please verify your address or use your current location."
          });
        }

        if (typeof lat !== 'number' || typeof lng !== 'number' ||
          !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return res.status(400).json({
            error: "Invalid coordinate format. Please try verifying your address again."
          });
        }

        if (lat === 0 && lng === 0) {
          return res.status(400).json({
            error: "Valid location coordinates are required. Please verify your address or use your current location."
          });
        }

        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          return res.status(400).json({
            error: "Coordinates are out of valid range. Please check your location and try again."
          });
        }
      }

      const business = await storage.addBusiness({
        ...data,
        userId: (req.user as AppUser).id
      });
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(500).json({ error: "Failed to create business" });
    }
  });

  app.get("/api/businesses/:id", isAuthenticated, async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);

      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      // Verify ownership
      if (business.userId && business.userId !== (req.user as AppUser).id) {
        return res.status(403).json({ error: "Unauthorized access to this business" });
      }

      res.json(business);
    } catch (error) {
      console.error("Error getting business:", error);
      res.status(500).json({ error: "Failed to get business" });
    }
  });

  app.delete("/api/businesses/:id", isAuthenticated, async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      if (business.userId && business.userId !== (req.user as AppUser).id) {
        return res.status(403).json({ error: "Unauthorized access to this business" });
      }

      const deleted = await storage.deleteBusiness(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Business not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting business:", error);
      res.status(500).json({ error: "Failed to delete business" });
    }
  });

  app.put("/api/businesses/:id", isAuthenticated, async (req, res) => {
    try {
      const validationResult = insertBusinessSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.flatten()
        });
      }

      const data = validationResult.data;

      // Validate coordinates if provided
      if (data.latitude !== undefined || data.longitude !== undefined) {
        const lat = data.latitude;
        const lng = data.longitude;

        if (lat !== undefined && lat !== null && (typeof lat !== 'number' || !Number.isFinite(lat) || Math.abs(lat) > 90)) {
          return res.status(400).json({ error: "Invalid latitude" });
        }

        if (lng !== undefined && lng !== null && (typeof lng !== 'number' || !Number.isFinite(lng) || Math.abs(lng) > 180)) {
          return res.status(400).json({ error: "Invalid longitude" });
        }
      }

      const existingBusiness = await storage.getBusiness(req.params.id);
      if (!existingBusiness) {
        return res.status(404).json({ error: "Business not found" });
      }

      if (existingBusiness.userId && existingBusiness.userId !== (req.user as AppUser).id) {
        return res.status(403).json({ error: "Unauthorized access to this business" });
      }

      const updatedBusiness = await storage.updateBusiness(req.params.id, data);
      res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business:", error);
      if (error instanceof Error && error.message === "Business not found") {
        return res.status(404).json({ error: "Business not found" });
      }
      res.status(500).json({ error: "Failed to update business" });
    }
  });

  app.post("/api/reports/save-existing", isAuthenticated, async (req, res) => {
    try {
      const { businessId, report } = req.body;

      if (!report) {
        return res.status(400).json({ error: "Missing report data" });
      }

      // Save report linked to the current user
      const savedReport = await storage.createReport({
        userId: (req.user as any).id,
        businessId,
        businessName: report.businessName,
        competitors: report.competitors,
        aiAnalysis: report.aiAnalysis,
        html: report.html || "",
      });

      res.json(savedReport);
    } catch (error) {
      console.error("Error saving existing report:", error);
      res.status(500).json({ error: "Failed to save report" });
    }
  });

  app.post("/api/run-report/:id", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.params.id;
      const { email, language } = req.body;
      const reportLanguage = language || "en";

      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      const report = await runReportForBusiness(businessId, language, undefined, (req.user as AppUser).id);
      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.post("/api/reports/:id/email", isAuthenticated, async (req, res) => {
    try {
      const { email, language } = req.body;
      const reportId = req.params.id;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Verify ownership (or allow admin override if implemented later)
      // Check if the report belongs to a user's business
      // This is slightly complex as reports are linked to businesses OR just user created
      // For now, if the user can see the report (which is handled by getReport usually needing auth, but getReport here is internal storage method)
      // The storage.getReport doesn't check permissions, so we should check:
      if (report.userId && report.userId !== (req.user as AppUser).id) {
        return res.status(403).json({ error: "Unauthorized access to this report" });
      }

      const { emailService } = await import("./email");
      // Use the provided language or user preference, normalized to 2 characters
      const requestedLang = language || (req.user as AppUser).language || "en";
      const normalizedLang = requestedLang.substring(0, 2).toLowerCase();

      const success = await emailService.sendAdHocReport(email, report, normalizedLang);

      if (success) {
        res.json({ message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending report email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.get("/api/reports/business/:businessId", isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getReportsByBusinessId(req.params.businessId);
      res.json(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  app.get("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getReportsByUserId((req.user as AppUser).id);
      res.json(reports);
    } catch (error) {
      console.error("Error listing reports:", error);
      res.status(500).json({ error: "Failed to list reports" });
    }
  });

  // START: Google Places API status endpoint
  app.get("/api/google-places/status", async (req, res) => {
    res.json({ configured: hasGoogleApiKey() });
  });
  // END: Google Places API status endpoint

  // Proxy for Google Static Maps to avoid exposing API key
  app.get("/api/static-map", async (req, res) => {
    const { center, markers } = req.query;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).send("Google API Key not configured");
    }

    if (!center) {
      return res.status(400).send("Center is required");
    }

    // Construct the Google Static Maps URL
    // Size: 600x400 (standard for PDF)
    // Scale: 2 (for high DPI)
    // Maptype: roadmap
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=14&size=600x400&scale=2&maptype=roadmap&key=${apiKey}`;

    // Add main business marker (blue)
    url += `&markers=color:blue|${center}`;

    // Add competitor markers (red)
    if (markers) {
      const markerList = (markers as string).split('|');
      markerList.forEach(marker => {
        url += `&markers=color:red|size:small|${marker}`;
      });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error fetching static map:", error);
      res.status(500).send("Failed to fetch map");
    }
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, language } = req.body;
      const normalizedEmail = email?.toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({ error: "Email is required" });
      }

      const { sendEmail, generatePasswordResetEmail } = await import("./email");
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
        pt: "Recuperação de Password - Competitive Watcher",
        en: "Password Recovery - Competitive Watcher",
        es: "Recuperación de contraseña - Competitive Watcher",
        fr: "Récupération de mot de passe - Competitive Watcher",
        de: "Passwort-Wiederherstellung - Competitive Watcher"
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

  // Get User's Report History
  app.get("/api/reports/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const reports = await storage.getReportsByUserId((req.user as AppUser).id);
    res.json(reports);
  });

  app.get("/api/reports/:id", isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error getting report:", error);
      res.status(500).json({ error: "Failed to get report" });
    }
  });

  app.get("/api/scheduler/status", isAuthenticated, async (req, res) => {
    try {
      const status = getSchedulerStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      res.status(500).json({ error: "Failed to get scheduler status" });
    }
  });

  app.post("/api/scheduler/run-all", isAuthenticated, async (req, res) => {
    try {
      const results = await runScheduledReports();
      res.json(results);
    } catch (error) {
      console.error("Error running scheduled reports:", error);
      res.status(500).json({ error: "Failed to run scheduled reports" });
    }
  });

  app.get("/api/places/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: "Search query is required" });
      }

      if (!hasGoogleApiKey()) {
        return res.json({
          results: [],
          apiKeyMissing: true,
          message: "Google API key not configured. Manual address entry required."
        });
      }

      const results = await searchPlacesByAddress(query);
      res.json({ results, apiKeyMissing: false });
    } catch (error) {
      console.error("Error searching places:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });

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

  startScheduler();

  // Authenticated Address Analysis
  app.post("/api/analyze-address", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { address, type, radius, language = 'en' } = req.body;

      if (!address || !type || !radius) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Search for coordinates
      let coordinates = null;
      if (hasGoogleApiKey()) {
        const searchResults = await searchPlacesByAddress(address);
        if (searchResults && searchResults.length > 0) {
          coordinates = {
            latitude: searchResults[0].latitude,
            longitude: searchResults[0].longitude
          };
        }
      }

      if (!coordinates) {
        return res.status(400).json({ error: "Address not found" });
      }

      // Create temp business object
      const tempBusiness = {
        id: 'analysis-' + Date.now(),
        name: address.split(',')[0],
        type,
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationStatus: 'validated' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null // Temp business has no user
      };

      // Generate report
      const report = await runReportForBusiness(tempBusiness.id, language, tempBusiness, (req.user as AppUser).id, radius);

      // Save report with userId
      // Exclude id and generatedAt to let DB handle them
      const { id: _tempId, generatedAt: _tempGenAt, ...reportData } = report;

      const savedReport = await storage.createReport({
        ...reportData,
        userId: (req.user as AppUser).id,
        businessId: null, // Explicitly set to null for ad-hoc analysis
        radius: reportData.radius || undefined
      });

      res.json({
        ...savedReport,
        latitude: tempBusiness.latitude,
        longitude: tempBusiness.longitude
      });
    } catch (error) {
      console.error("Analysis error details:", error);
      res.status(500).json({ error: "Failed to run analysis" });
    }
  });

  // Update user language preference
  app.post("/api/user/language", isAuthenticated, async (req, res) => {
    try {
      const { language } = req.body;
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }

      await db!
        .update(users)
        .set({ language, updatedAt: new Date() })
        .where(eq(users.id, (req.user as any).id));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update language:", error);
      res.status(500).json({ error: "Failed to update language" });
    }
  });

  // External Cron Trigger Endpoint
  app.post("/api/cron/trigger-reports", async (req, res) => {
    try {
      const authHeader = req.headers["x-cron-secret"];
      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret || authHeader !== cronSecret) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("[Cron] Triggered report generation via API");

      // Run in background but wait for result to return status
      const results = await runScheduledReports();

      res.json({
        message: "Scheduled reports triggered successfully",
        results
      });
    } catch (error) {
      console.error("[Cron] Error triggering reports:", error);
      res.status(500).json({ error: "Failed to trigger reports" });
    }
  });

  return httpServer;
}

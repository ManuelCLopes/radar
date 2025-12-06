import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runReportForBusiness } from "./reports";
import { startScheduler, getSchedulerStatus, runScheduledReports } from "./scheduler";
import { searchPlacesByAddress, hasGoogleApiKey } from "./googlePlaces";
import { type InsertBusiness, insertBusinessSchema, type User as AppUser } from "@shared/schema";


import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
        name: 'Quick Search',
        type,
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        locationStatus: 'validated' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Generate report (this will use existing report logic)
      const report = await runReportForBusiness(tempBusiness.id, language, tempBusiness);

      // Limit to preview mode: only first 3 competitors
      const previewCompetitors = report.competitors?.slice(0, 3) || [];
      const totalFound = report.competitors?.length || 0;

      // Truncate AI insights to 200 characters
      const aiInsights = report.aiAnalysis?.substring(0, 200) + (report.aiAnalysis && report.aiAnalysis.length > 200 ? '...' : '');

      // Track search in database (if available)
      try {
        if (storage.trackSearch) {
          await storage.trackSearch({
            userId: null,
            address,
            type,
            radius,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            competitorsFound: totalFound,
            isPreview: true,
            ipAddress: clientIp
          });
        }
      } catch (trackError) {
        console.warn('Failed to track search:', trackError);
        // Continue even if tracking fails
      }

      res.json({
        preview: true,
        competitors: previewCompetitors,
        totalFound,
        aiInsights,
        searchId: 'temp-' + Date.now(),
        location: {
          address,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        radius
      });
    } catch (error) {
      console.error("Error in quick search:", error);
      res.status(500).json({ error: "Failed to perform search" });
    }
  });

  // Protected API routes
  app.get("/api/businesses", isAuthenticated, async (req, res) => {
    try {
      const businesses = await storage.listBusinesses();
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

      const business = await storage.addBusiness(data);
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

      res.json(business);
    } catch (error) {
      console.error("Error getting business:", error);
      res.status(500).json({ error: "Failed to get business" });
    }
  });

  app.delete("/api/businesses/:id", isAuthenticated, async (req, res) => {
    try {
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

  app.post("/api/run-report/:id", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.params.id;
      const language = req.body?.language || "en";

      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      const report = await runReportForBusiness(businessId, language);
      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
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
      const reports = await storage.listAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error listing reports:", error);
      res.status(500).json({ error: "Failed to list reports" });
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
        updatedAt: new Date()
      };

      // Generate report
      const report = await runReportForBusiness(tempBusiness.id, language, tempBusiness);

      // Save report with userId
      // Exclude id and generatedAt to let DB handle them
      const { id: _tempId, generatedAt: _tempGenAt, ...reportData } = report;

      const savedReport = await storage.createReport({
        ...reportData,
        userId: (req.user as AppUser).id,
        businessId: null // Explicitly set to null for ad-hoc analysis
      });

      res.json(savedReport);
    } catch (error) {
      console.error("Analysis error details:", error);
      res.status(500).json({ error: "Failed to run analysis" });
    }
  });



  return httpServer;
}

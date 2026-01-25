import type { Express } from "express";
import { storage } from "../storage";
import { insertBusinessSchema, type User as AppUser } from "@shared/schema";
import { isAuthenticated } from "../auth";
import { getPlanLimits } from "../limits";

export function registerBusinessRoutes(app: Express) {
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
            const user = req.user as AppUser;
            const limits = getPlanLimits(user.plan);
            const existingBusinesses = await storage.listBusinesses(user.id);

            if (existingBusinesses.length >= limits.maxBusinesses) {
                return res.status(403).json({
                    error: "Business limit reached",
                    message: `Your current plan allows for ${limits.maxBusinesses} business(es). Please upgrade to add more.`
                });
            }

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
}

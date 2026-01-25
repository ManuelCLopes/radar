import type { Express } from "express";
import { storage } from "../storage";
import { searchPlacesByAddress, hasGoogleApiKey } from "../googlePlaces";
import { runReportForBusiness } from "../reports";
import { isAuthenticated } from "../auth";

export function registerSearchRoutes(app: Express) {
    app.post("/api/quick-search", async (req, res) => {
        try {
            const clientIp = typeof req.ip === 'string' ? req.ip : (req.socket.remoteAddress || 'unknown');

            // Database Rate Limiting
            try {
                const limitResult = await storage.checkRateLimit(clientIp);
                if (!limitResult.allowed) {
                    return res.status(429).json({
                        error: "Rate limit exceeded",
                        message: "Too many searches. Create a free account for unlimited searches.",
                        resetTime: limitResult.resetTime?.getTime()
                    });
                }
            } catch (error) {
                // Fallback or skip rate limiting if DB is not connected
                // console.warn("Database connection missing - skipping rate limiting");
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

    // START: Google Places API status endpoint
    app.get("/api/google-places/status", async (req, res) => {
        res.json({ configured: hasGoogleApiKey() });
    });
}

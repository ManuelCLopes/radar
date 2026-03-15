import type { Express } from "express";
import { storage } from "../storage.js";
import { searchPlacesByAddress, hasGoogleApiKey } from "../googlePlaces.js";
import { runReportForBusiness } from "../reports.js";
import { isAuthenticated } from "../auth.js";
import { searchRateLimiter } from "../middleware/rate-limit.js";

const formatCoordinateAddress = (latitude: number, longitude: number) =>
    `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

const reverseGeocodeUserAgent = "competitor-watcher/1.0 (+https://competitorwatcher.pt)";

const normalizeAddressPart = (value: unknown): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim().replace(/\s+/g, " ");
    return trimmed || null;
};

const firstAddressPart = (...values: unknown[]): string | null => {
    for (const value of values) {
        const normalized = normalizeAddressPart(value);
        if (normalized) {
            return normalized;
        }
    }

    return null;
};

const joinAddressParts = (...parts: Array<string | null>): string | null => {
    const uniqueParts: string[] = [];

    for (const part of parts) {
        if (!part) {
            continue;
        }

        if (!uniqueParts.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
            uniqueParts.push(part);
        }
    }

    return uniqueParts.length > 0 ? uniqueParts.join(", ") : null;
};

const buildReadableNominatimAddress = (data: any): string | null => {
    const address = typeof data?.address === "object" && data.address !== null
        ? data.address as Record<string, unknown>
        : null;

    if (!address) {
        return normalizeAddressPart(data?.display_name);
    }

    const streetName = firstAddressPart(
        address.road,
        address.pedestrian,
        address.footway,
        address.cycleway,
        address.path,
        address.residential,
        address.house_name,
    );
    const houseNumber = firstAddressPart(address.house_number);
    const streetLine = streetName && houseNumber
        ? `${streetName} ${houseNumber}`
        : streetName || houseNumber;

    const locality = firstAddressPart(
        address.city,
        address.town,
        address.village,
        address.hamlet,
        address.municipality,
        address.city_district,
        address.suburb,
        address.neighbourhood,
        address.county,
    );
    const region = firstAddressPart(
        address.state_district,
        address.state,
        address.region,
    );
    const country = firstAddressPart(address.country);

    return joinAddressParts(
        streetLine,
        locality,
        region,
        country,
    ) || normalizeAddressPart(data?.display_name);
};

const buildReadableBigDataCloudAddress = (data: any): string | null => {
    const locality = firstAddressPart(data?.locality);
    const city = firstAddressPart(data?.city);
    const region = firstAddressPart(data?.principalSubdivision);
    const country = firstAddressPart(data?.countryName);

    return joinAddressParts(locality, city, region, country);
};

const getPreferredLanguage = (value: unknown): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    const language = value
        .split(",")[0]
        ?.trim()
        .replace(/_/g, "-");

    return language || null;
};

const reverseGeocodeWithNominatim = async (
    latitude: number,
    longitude: number,
    language: string,
): Promise<string | null> => {
    try {
        const params = new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: "jsonv2",
            addressdetails: "1",
            zoom: "18",
            "accept-language": language,
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: {
                Accept: "application/json",
                "User-Agent": reverseGeocodeUserAgent,
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return buildReadableNominatimAddress(data);
    } catch (error) {
        console.error("Nominatim reverse geocoding error:", error);
        return null;
    }
};
const reverseGeocodeWithBigDataCloud = async (
    latitude: number,
    longitude: number,
    language: string,
): Promise<string | null> => {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            localityLanguage: language.split("-")[0] || language,
        });

        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`, {
            headers: {
                Accept: "application/json",
                "User-Agent": reverseGeocodeUserAgent,
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return buildReadableBigDataCloudAddress(data);
    } catch (error) {
        console.error("BigDataCloud reverse geocoding error:", error);
        return null;
    }
};
export function registerSearchRoutes(app: Express) {
    app.post("/api/quick-search", searchRateLimiter, async (req, res) => {
        try {
            const clientIp = typeof req.ip === 'string' ? req.ip : (req.socket.remoteAddress || 'unknown');


            const { address, type, radius, language = 'en', latitude, longitude } = req.body;

            // Require either address OR coordinates
            if ((!address && (!latitude || !longitude)) || !type || !radius) {
                return res.status(400).json({
                    error: "Missing required fields",
                    message: "Address (or coordinates), type, and radius are required"
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

            // Search for the address to get coordinates OR use provided coordinates
            let coordinates = null;

            if (latitude && longitude) {
                coordinates = { latitude, longitude };
            } else if (hasGoogleApiKey() && address) {
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
                    error: "Location not found",
                    message: "Could not determine location coordinates"
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
                userId: null, // Temp business has no user
                rating: null,
                userRatingsTotal: null
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

    app.get("/api/places/search", isAuthenticated, searchRateLimiter, async (req, res) => {
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

    app.post("/api/places/reverse-geocode", async (req, res) => {
        try {
            const { latitude, longitude } = req.body;
            const lat = Number(latitude);
            const lng = Number(longitude);
            const preferredLanguage =
                getPreferredLanguage(req.body?.language) ||
                getPreferredLanguage(req.headers["accept-language"]) ||
                "en";

            if (Number.isNaN(lat) || Number.isNaN(lng)) {
                return res.status(400).json({ error: "Latitude and Longitude are required" });
            }

            let address: string | null = null;

            if (hasGoogleApiKey()) {
                const { reverseGeocode } = await import("../googlePlaces.js");
                address = await reverseGeocode(lat, lng);
            }

            if (!address) {
                address = await reverseGeocodeWithNominatim(lat, lng, preferredLanguage);
            }

            if (!address) {
                address = await reverseGeocodeWithBigDataCloud(lat, lng, preferredLanguage);
            }

            res.json({ address: address || formatCoordinateAddress(lat, lng) });
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            res.status(500).json({ error: "Failed to reverse geocode" });
        }
    });
}

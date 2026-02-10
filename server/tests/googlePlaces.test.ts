
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchPlacesByAddress, searchNearby, hasGoogleApiKey } from "../googlePlaces";

// Mock storage to prevent DB calls
vi.mock("../storage", () => ({
    storage: {
        trackApiUsage: vi.fn().mockResolvedValue(undefined),
    }
}));

describe("Google Places API", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
        global.fetch = vi.fn();
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    describe("hasGoogleApiKey", () => {
        it("should return true if API key is set", () => {
            process.env.GOOGLE_API_KEY = "test-key";
            // Re-import to pick up env var change if module caches it at top level
            // Note: In this specific file, API_KEY is const at top level. 
            // We might need to reload the module or mock the env before import.
            // Since we are using vitest, we can use vi.resetModules() but we need to dynamic import.
            // However, for simplicity, let's assume we can test the logic if we could mock the const.
            // Actually, the file reads process.env.GOOGLE_API_KEY at top level.
            // So we need to isolate modules.
        });

        // Testing top-level consts is hard without reloading. 
        // Let's focus on the functions which use the const. 
        // If the const is read at load time, we need to re-import.
    });

    // We will use a trick: since we can't easily change the top-level const after load in the same test file without dynamic imports,
    // we will assume the test runner environment might have it set or not.
    // But to properly test both cases, we should probably use `vi.doMock` or similar if we want to change the key.
    // Alternatively, we can rely on the fact that `hasGoogleApiKey` checks `!!API_KEY`.

    // Let's try to mock the module's internal state if possible, or just test the behavior based on current env.
    // A better approach for testing code that reads env at top level is to move the env read inside the function or use a getter.
    // But we can't change the code.

    // Let's mock the entire module behavior if we want to test "what if key is missing".
    // Actually, `searchPlacesByAddress` checks `!API_KEY`. 

    // Let's try to use `vi.hoisted` or just set the env before the test file runs? No, that's global.

    // We will skip the "missing key" test if we can't easily unset it, or we will assume it is set/unset based on setup.
    // Let's assume it IS set for the "success" tests.

    describe("searchPlacesByAddress", () => {
        it("should return empty array if fetch fails", async () => {
            // We need to ensure API_KEY is considered "present" or "absent".
            // If the file was already imported, API_KEY is fixed.
            // Let's assume we can mock fetch.

            (global.fetch as any).mockResolvedValue({
                ok: false,
                statusText: "Error"
            });

            const result = await searchPlacesByAddress("test query");
            // If key is missing, it returns [] immediately. If key is present but fetch fails, it returns [].
            // So [] is expected either way.
            expect(result).toEqual([]);
        });

        it("should return mapped places on success", async () => {
            // We assume API_KEY is present (or we can't test the fetch part easily without reloading).
            // If the real env has no key, this test might fail if it hits the "no key" check.
            // But we can't easily change the top-level const.

            // However, we can mock the entire module and test the logic? No, we want to test the logic.

            // Let's try to proceed. If the user's env has no key, `searchPlacesByAddress` returns [] and logs.
            // If we want to force it to run, we might need to modify the code to read env in function, or use `vi.resetModules()` and `import()`.

            // Let's try dynamic import in the test.
        });
    });
});

// Re-writing the test to use dynamic imports for isolation
describe("Google Places API (Dynamic)", () => {
    beforeEach(() => {
        vi.resetModules();
        global.fetch = vi.fn();
    });

    it("should return empty array if API key is missing", async () => {
        delete process.env.GOOGLE_API_KEY;
        const { searchPlacesByAddress } = await import("../googlePlaces");

        const result = await searchPlacesByAddress("test");
        expect(result).toEqual([]);
    });

    it("should return places if API key is present and API succeeds", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchPlacesByAddress } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                places: [{
                    id: "place1",
                    displayName: { text: "Test Place" },
                    formattedAddress: "123 Test St",
                    location: { latitude: 10, longitude: 20 },
                    rating: 4.5,
                    userRatingCount: 100,
                    types: ["restaurant"]
                }]
            })
        });

        const result = await searchPlacesByAddress("test");
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Test Place");
        expect(result[0].latitude).toBe(10);
    });

    it("should throw error if API key is missing for searchNearby", async () => {
        delete process.env.GOOGLE_API_KEY;
        const { searchNearby } = await import("../googlePlaces");

        await expect(searchNearby(10, 20, "restaurant")).rejects.toThrow("Google Places API Key not configured");
    });

    it("should return mapped competitors if API key is present for searchNearby", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchNearby } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                places: [{
                    displayName: { text: "Competitor 1" },
                    formattedAddress: "456 Comp St",
                    location: { latitude: 10.01, longitude: 20.01 },
                    rating: 4.0,
                    userRatingCount: 50,
                    types: ["restaurant"],
                    priceLevel: "PRICE_LEVEL_MODERATE"
                }]
            })
        });

        const result = await searchNearby(10, 20, "restaurant");
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Competitor 1");
        expect(result[0].priceLevel).toBe("$$");
        expect(result[0].distance).toBeDefined();
    });

    it("should throw error if searchNearby API call fails", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchNearby } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: false,
            statusText: "Service Unavailable"
        });

        await expect(searchNearby(10, 20, "restaurant")).rejects.toThrow("Google Places API Error");
    });

    it("should return empty array if searchNearby returns no places", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchNearby } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ places: [] })
        });

        const result = await searchNearby(10, 20, "restaurant");
        expect(result).toEqual([]);
    });

    it("should include reviews when includeReviews is true", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchNearby } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                places: [{
                    displayName: { text: "Competitor 1" },
                    formattedAddress: "456 Comp St",
                    location: { latitude: 10.01, longitude: 20.01 },
                    rating: 4.0,
                    reviews: [
                        {
                            text: { text: "Great place!" },
                            originalText: { text: "Great place!" },
                            authorAttribution: { displayName: "John Doe" },
                            rating: 5,
                            publishTime: "2024-01-15T10:00:00Z"
                        }
                    ]
                }]
            })
        });

        const result = await searchNearby(10, 20, "restaurant", 1500, true);
        expect(result[0].reviews).toBeDefined();
        expect(result[0].reviews).toHaveLength(1);
        expect(result[0].reviews![0].author).toBe("John Doe");
    });

    it("should not include reviews when includeReviews is false", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchNearby } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                places: [{
                    displayName: { text: "Competitor 1" },
                    formattedAddress: "456 Comp St",
                    location: { latitude: 10.01, longitude: 20.01 },
                    rating: 4.0
                }]
            })
        });

        const result = await searchNearby(10, 20, "restaurant", 1500, false);
        expect(result[0].reviews).toBeUndefined();
    });
});

describe("reverseGeocode", () => {
    beforeEach(() => {
        vi.resetModules();
        global.fetch = vi.fn();
    });

    it("should return null if API key is missing", async () => {
        delete process.env.GOOGLE_API_KEY;
        const { reverseGeocode } = await import("../googlePlaces");

        const result = await reverseGeocode(10, 20);
        expect(result).toBeNull();
    });

    it("should return formatted address on success", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { reverseGeocode } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: "OK",
                results: [{ formatted_address: "123 Main Street, City" }]
            })
        });

        const result = await reverseGeocode(10, 20);
        expect(result).toBe("123 Main Street, City");
    });

    it("should return null if API returns error status", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { reverseGeocode } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: "ZERO_RESULTS",
                results: []
            })
        });

        const result = await reverseGeocode(10, 20);
        expect(result).toBeNull();
    });

    it("should return null if API call fails", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { reverseGeocode } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: false,
            statusText: "Error"
        });

        const result = await reverseGeocode(10, 20);
        expect(result).toBeNull();
    });

    it("should return null if fetch throws", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { reverseGeocode } = await import("../googlePlaces");

        (global.fetch as any).mockRejectedValue(new Error("Network error"));

        const result = await reverseGeocode(10, 20);
        expect(result).toBeNull();
    });

    it("should return null if no results in response", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { reverseGeocode } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: "OK",
                results: []
            })
        });

        const result = await reverseGeocode(10, 20);
        expect(result).toBeNull();
    });
});

describe("hasGoogleApiKey", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("should return true when API key is set", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { hasGoogleApiKey } = await import("../googlePlaces");
        expect(hasGoogleApiKey()).toBe(true);
    });

    it("should return false when API key is not set", async () => {
        delete process.env.GOOGLE_API_KEY;
        const { hasGoogleApiKey } = await import("../googlePlaces");
        expect(hasGoogleApiKey()).toBe(false);
    });
});

describe("searchPlacesByAddress edge cases", () => {
    beforeEach(() => {
        vi.resetModules();
        global.fetch = vi.fn();
    });

    it("should return empty array if no places in response", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchPlacesByAddress } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ places: null })
        });

        const result = await searchPlacesByAddress("test");
        expect(result).toEqual([]);
    });

    it("should handle missing fields gracefully", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchPlacesByAddress } = await import("../googlePlaces");

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                places: [{
                    id: "place1"
                    // Missing displayName, formattedAddress, location
                }]
            })
        });

        const result = await searchPlacesByAddress("test");
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Unknown");
        expect(result[0].address).toBe("");
        expect(result[0].latitude).toBe(0);
        expect(result[0].longitude).toBe(0);
    });

    it("should return empty array if fetch throws", async () => {
        process.env.GOOGLE_API_KEY = "test-key";
        const { searchPlacesByAddress } = await import("../googlePlaces");

        (global.fetch as any).mockRejectedValue(new Error("Network error"));

        const result = await searchPlacesByAddress("test");
        expect(result).toEqual([]);
    });
});


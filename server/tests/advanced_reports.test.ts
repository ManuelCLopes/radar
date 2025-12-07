import { describe, it, expect, vi, beforeEach } from "vitest";
import { runReportForBusiness } from "../reports";
import { storage } from "../storage";
import { insertBusinessSchema } from "@shared/schema";
import OpenAI from "openai";

// Mock OpenAI
const { createMock } = vi.hoisted(() => {
    return {
        createMock: vi.fn().mockResolvedValue({
            choices: [
                {
                    message: {
                        content: `### SWOT Analysis
#### Strengths
- Strength 1
#### Weaknesses
- Weakness 1
#### Opportunities
- Opportunity 1
#### Threats
- Threat 1

### Market Trends
- Trend 1
- Trend 2
- Trend 3`,
                    },
                },
            ],
        }),
    };
});

vi.mock("openai", () => {
    return {
        default: class {
            chat = {
                completions: {
                    create: createMock,
                },
            };
        },
    };
});

// Mock Google Places
vi.mock("../googlePlaces", () => ({
    searchNearby: vi.fn().mockResolvedValue([
        {
            name: "Competitor 1",
            address: "123 Main St",
            rating: 4.5,
            userRatingsTotal: 100,
            priceLevel: "$$",
            distance: "0.5 km",
            reviews: [
                { text: "Review 1: Great place!", author: "User 1", rating: 5, date: "2023-01-01" },
                { text: "Review 2: Good service", author: "User 2", rating: 4, date: "2023-01-02" },
                { text: "Review 3: Nice atmosphere", author: "User 3", rating: 5, date: "2023-01-03" },
                { text: "Review 4: Tasty food", author: "User 4", rating: 4, date: "2023-01-04" },
                { text: "Review 5: Will come back", author: "User 5", rating: 5, date: "2023-01-05" }
            ],
        },
    ]),
}));

describe("Advanced Reports", () => {
    beforeEach(async () => {
        // Clear storage
        const businesses = await storage.listBusinesses();
        for (const b of businesses) {
            await storage.deleteBusiness(b.id);
        }
        createMock.mockClear();
    });

    it("should include SWOT and Trends in prompt for professional plan", async () => {
        // Create a user with professional plan
        const user = await storage.upsertUser({
            email: "pro@example.com",
            plan: "professional",
        });

        // Create a business
        const business = await storage.addBusiness({
            name: "Pro Business",
            type: "restaurant",
            address: "456 Test Ave",
            latitude: 40.7128,
            longitude: -74.0060,
            locationStatus: "validated",
        });

        // Run report
        await runReportForBusiness(business.id, "en", undefined, user.id);

        // Check if prompt contained SWOT and Trends instructions
        const callArgs = createMock.mock.calls[0][0] as any;
        const prompt = callArgs.messages[1].content;

        expect(prompt).toContain("SWOT ANALYSIS");
        expect(prompt).toContain("MARKET TRENDS");
        expect(prompt).toContain("TARGET AUDIENCE PERSONA");
        expect(prompt).toContain("MARKETING STRATEGY");
        expect(prompt).toContain("CUSTOMER SENTIMENT & REVIEW INSIGHTS");
        expect(prompt).toContain("Synthesize");

        // Check for new formatting and review analysis instructions
        expect(prompt).toContain("CUSTOMER SENTIMENT & REVIEW INSIGHTS");
        expect(prompt).toContain("Synthesize");

        // Check for new formatting and review analysis instructions
        expect(prompt).toContain("FORMATTING");
        expect(prompt).toContain("REVIEW ANALYSIS");
        // Check if reviews are included (mocked in test setup)
        // Note: We need to ensure the mock competitors have reviews for this to pass
        // For now, we just check the structure if reviews were present
    });

    it("should NOT include SWOT and Trends in prompt for essential plan", async () => {
        // Create a user with essential plan
        const user = await storage.upsertUser({
            email: "essential@example.com",
            plan: "essential",
        });

        // Create a business
        const business = await storage.addBusiness({
            name: "Essential Business",
            type: "cafe",
            address: "789 Test Blvd",
            latitude: 40.7128,
            longitude: -74.0060,
            locationStatus: "validated",
        });

        // Run report
        await runReportForBusiness(business.id, "en", undefined, user.id);

        // Check if prompt contained SWOT and Trends instructions
        const callArgs = createMock.mock.calls[0][0] as any;
        const prompt = callArgs.messages[1].content;

        expect(prompt).not.toContain("SWOT ANALYSIS");
        expect(prompt).not.toContain("MARKET TRENDS");

        // Check that review analysis is included even for essential plan
        expect(prompt).toContain("REVIEW THEME ANALYSIS");
        expect(prompt).toContain("QUOTE");
    });
});

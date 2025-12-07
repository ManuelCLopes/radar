
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeCompetitors } from "../ai";

// Mock OpenAI
const { mockCreate } = vi.hoisted(() => {
    return { mockCreate: vi.fn() };
});

vi.mock("openai", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        })),
    };
});

describe("AI Analysis", () => {
    const mockBusiness = {
        id: "1",
        name: "My Business",
        type: "restaurant",
        address: "123 Main St",
        latitude: 10,
        longitude: 20,
        locationStatus: "validated",
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return localized message if no competitors found", async () => {
        const resultEn = await analyzeCompetitors(mockBusiness, [], "en");
        expect(resultEn).toContain("Great news! No direct competitors were found");

        const resultPt = await analyzeCompetitors(mockBusiness, [], "pt");
        expect(resultPt).toContain("Ótimas notícias! Não foram encontrados concorrentes");
    });

    it("should call OpenAI and return analysis", async () => {
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: "AI Analysis Result" } }],
        });

        const competitors = [{
            name: "Comp 1",
            address: "Addr 1",
            rating: 4.5,
            userRatingsTotal: 100,
            priceLevel: "$$",
            distance: "1km",
        }];

        const result = await analyzeCompetitors(mockBusiness, competitors, "en");

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            messages: expect.arrayContaining([
                expect.objectContaining({ role: "system" }),
                expect.objectContaining({ role: "user", content: expect.stringContaining("My Business") })
            ])
        }));
        expect(result).toBe("AI Analysis Result");
    });

    it("should return fallback analysis if OpenAI fails", async () => {
        mockCreate.mockRejectedValue(new Error("OpenAI Error"));

        const competitors = [{
            name: "Comp 1",
            address: "Addr 1",
            rating: 4.5,
            userRatingsTotal: 100,
        }];

        const result = await analyzeCompetitors(mockBusiness, competitors, "en");

        expect(result).toContain("COMPETITOR ANALYSIS REPORT FOR");
        expect(result).toContain("MARKET OVERVIEW");
    });

    it("should return fallback analysis if OpenAI returns empty response", async () => {
        mockCreate.mockResolvedValue({
            choices: [{ message: { content: null } }],
        });

        const competitors = [{ name: "Comp 1" }];
        const result = await analyzeCompetitors(mockBusiness, competitors, "en");

        expect(result).toContain("COMPETITOR ANALYSIS REPORT FOR");
    });

    it("should include review analysis in fallback report", async () => {
        mockCreate.mockRejectedValue(new Error("OpenAI Error"));

        const competitors = [
            {
                name: "Excellent Place",
                rating: 4.9,
                reviews: [{ text: "Great", rating: 5 }]
            },
            {
                name: "Good Place",
                rating: 4.6,
                reviews: [{ text: "Good", rating: 4 }]
            },
            {
                name: "Average Place",
                rating: 4.2,
                reviews: [{ text: "Okay", rating: 4 }]
            },
            {
                name: "Poor Place",
                rating: 3.5,
                reviews: [{ text: "Bad", rating: 3 }]
            }
        ];

        const result = await analyzeCompetitors(mockBusiness, competitors as any, "en");

        expect(result).toContain("Exceptional Excellence - Consistently positive feedback");
        expect(result).toContain("Very Strong - High customer satisfaction");
        expect(result).toContain("Good Performance - Generally positive but room for improvement");
        // The 4th competitor is not in top 3, so it might not be included if logic slices top 3.
        // ai.ts: const topCompetitors = competitors.slice(0, 3);
        // So "Poor Place" should NOT be in the report.
        expect(result).not.toContain("Mixed/Variable - Inconsistent experiences reported");
    });

    it("should include review analysis in fallback report (mixed sentiment)", async () => {
        mockCreate.mockRejectedValue(new Error("OpenAI Error"));

        const competitors = [
            {
                name: "Poor Place",
                rating: 3.5,
                reviews: [{ text: "Bad", rating: 3 }]
            }
        ];

        const result = await analyzeCompetitors(mockBusiness, competitors as any, "en");

        expect(result).toContain("Mixed/Variable - Inconsistent experiences reported");
    });
});

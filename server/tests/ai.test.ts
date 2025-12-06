
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
});

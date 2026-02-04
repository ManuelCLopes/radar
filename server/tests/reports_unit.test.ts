
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runReportForBusiness } from "../reports";
import { storage } from "../storage";
import { searchNearby } from "../googlePlaces";
import { analyzeCompetitors } from "../ai";

// Mock dependencies
vi.mock("../storage", () => ({
    storage: {
        getBusiness: vi.fn(),
        saveReport: vi.fn(),
        getUser: vi.fn(),
    },
}));

vi.mock("../googlePlaces", () => ({
    searchNearby: vi.fn(),
}));

vi.mock("../ai", () => ({
    analyzeCompetitors: vi.fn(),
}));

describe("Reports Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should throw error if business not found", async () => {
        (storage.getBusiness as any).mockResolvedValue(null);

        await expect(runReportForBusiness("non-existent-id")).rejects.toThrow("Business with ID non-existent-id not found");
    });

    it("should throw error if business has pending location", async () => {
        (storage.getBusiness as any).mockResolvedValue({
            id: "1",
            name: "Test Business",
            locationStatus: "pending",
            latitude: null,
            longitude: null,
        });

        await expect(runReportForBusiness("1")).rejects.toThrow('Business "Test Business" has pending location verification');
    });

    it("should generate and save report for existing business", async () => {
        const mockBusiness = {
            id: "1",
            name: "Test Business",
            type: "restaurant",
            latitude: 10,
            longitude: 20,
            locationStatus: "validated",
        };
        (storage.getBusiness as any).mockResolvedValue(mockBusiness);

        const mockCompetitors = [{ name: "Comp 1", address: "Addr 1" }];
        (searchNearby as any).mockResolvedValue(mockCompetitors);

        const mockAnalysis = {
            executiveSummary: "Mock Overview",
            swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            marketTrends: [],
            targetAudience: { demographics: "", psychographics: "", painPoints: "" },
            marketingStrategy: { primaryChannels: "", contentIdeas: "", promotionalTactics: "" },
            customerSentiment: { commonPraises: [], recurringComplaints: [], unmetNeeds: [] }
        };

        (analyzeCompetitors as any).mockResolvedValue(mockAnalysis);

        (storage.saveReport as any).mockImplementation((report) => Promise.resolve({ ...report, id: "report-1" }));

        const result = await runReportForBusiness("1", "en", undefined, "user-1");

        expect(storage.getBusiness).toHaveBeenCalledWith("1");
        expect(searchNearby).toHaveBeenCalledWith(10, 20, "restaurant", 1500, true, "en", 10);
        expect(analyzeCompetitors).toHaveBeenCalledWith(mockBusiness, mockCompetitors, "en", "free");
        expect(storage.saveReport).toHaveBeenCalledWith(expect.objectContaining({
            businessId: "1",
            userId: "user-1",
            executiveSummary: "Mock Overview",
        }));
        expect(result.id).toBe("report-1");
    });

    it("should generate report for temporary business without saving", async () => {
        const tempBusiness = {
            id: "temp-1",
            name: "Temp Business",
            type: "cafe",
            latitude: 30,
            longitude: 40,
            locationStatus: "validated",
        } as any;

        const mockAnalysis = {
            executiveSummary: "Temp Overview",
            swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            marketTrends: [],
            targetAudience: { demographics: "", psychographics: "", painPoints: "" },
            marketingStrategy: { primaryChannels: "", contentIdeas: "", promotionalTactics: "" },
            customerSentiment: { commonPraises: [], recurringComplaints: [], unmetNeeds: [] }
        };

        (searchNearby as any).mockResolvedValue([]);
        (analyzeCompetitors as any).mockResolvedValue(mockAnalysis);

        const result = await runReportForBusiness("temp-1", "en", tempBusiness);

        expect(storage.getBusiness).not.toHaveBeenCalled();
        expect(storage.saveReport).not.toHaveBeenCalled();
        expect(result.id).toContain("temp-");
        expect(result.executiveSummary).toBe("Temp Overview");
    });

    it("should generate report in requested language", async () => {
        const mockBusiness = {
            id: "1",
            name: "Test Business",
            type: "restaurant",
            latitude: 10,
            longitude: 20,
            locationStatus: "validated",
        };
        const mockAnalysis = {
            executiveSummary: "Resumo em PT",
            swot: { strengths: ["Força"], weaknesses: [], opportunities: [], threats: [] },
            marketTrends: [],
            targetAudience: { demographics: "", psychographics: "", painPoints: "" },
            marketingStrategy: { primaryChannels: "", contentIdeas: "", promotionalTactics: "" },
            customerSentiment: { commonPraises: [], recurringComplaints: [], unmetNeeds: [] }
        };

        (storage.getBusiness as any).mockResolvedValue(mockBusiness);
        (searchNearby as any).mockResolvedValue([]);
        (analyzeCompetitors as any).mockResolvedValue(mockAnalysis);
        (storage.saveReport as any).mockImplementation((r) => Promise.resolve(r));

        const result = await runReportForBusiness("1", "pt");

        expect(analyzeCompetitors).toHaveBeenCalledWith(mockBusiness, [], "pt", "free");
        expect(result.executiveSummary).toBe("Resumo em PT");
    });
    it("should throw error during data fetching", async () => {
        const mockBusiness = {
            id: "1",
            name: "Test Business",
            type: "restaurant",
            latitude: 10,
            longitude: 20,
            locationStatus: "validated",
        };
        (storage.getBusiness as any).mockResolvedValue(mockBusiness);

        // Mock searchNearby to throw error
        (searchNearby as any).mockRejectedValue(new Error("API Error"));

        await expect(runReportForBusiness("1", "en")).rejects.toThrow("API Error");

        // Should NOT be saved
        expect(storage.saveReport).not.toHaveBeenCalled();
    });
});

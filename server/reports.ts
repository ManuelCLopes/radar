import { randomUUID } from "crypto";
import { storage } from "./storage";
import { searchNearby } from "./googlePlaces";
import { analyzeCompetitors } from "./ai";
import type { Report, Business, InsertReport } from "@shared/schema";
import { getPlanLimits } from "./limits";

export async function runReportForBusiness(
  businessId: string,
  language: string = "en",
  providedBusiness?: Business,
  userId?: string,
  radius: number = 1500 // Default to 1500m if not provided
): Promise<Report> {
  const business = providedBusiness || await storage.getBusiness(businessId);

  if (!business) {
    throw new Error(`Business with ID ${businessId} not found`);
  }

  if (business.locationStatus === "pending" || business.latitude === null || business.longitude === null) {
    throw new Error(`Business "${business.name}" has pending location verification. Please verify the business location before generating a report.`);
  }

  let userPlan = "free";
  if (userId) {
    const user = await storage.getUser(userId);
    if (user) {
      userPlan = user.plan;
    }
  }

  const limits = getPlanLimits(userPlan);

  let competitors: import("@shared/schema").Competitor[] = [];
  let aiAnalysis: import("./ai").StructuredAnalysis;

  try {
    competitors = await searchNearby(
      business.latitude,
      business.longitude,
      business.type,
      radius,
      true, // Always include reviews
      language,
      limits.maxCompetitors
    );

    /*
     * For new reports, we get a structured object.
     * We no longer generate a monolithic HTML string for storage.
     * However, for temporary display or legacy compatibility in other parts of the system,
     * we might need to handle it.
     */
    aiAnalysis = await analyzeCompetitors(business, competitors, language, userPlan);

    // Attempt to fetch and update the business's own rating for trends
    if (!providedBusiness) {
      try {
        // Import searchPlacesByAddress dynamically or use top-level import
        // I'll assume top-level import needs to be added, but I can use import()
        const { searchPlacesByAddress } = await import("./googlePlaces");
        const businessSearchResults = await searchPlacesByAddress(
          `${business.name}, ${business.address}`
        );

        if (businessSearchResults.length > 0) {
          const selfMatch = businessSearchResults[0];
          if (selfMatch.rating) {
            await storage.updateBusiness(business.id, {
              rating: selfMatch.rating,
              userRatingsTotal: selfMatch.userRatingsTotal
            });
            console.log(`[Report] Updated rating for business ${business.name}: ${selfMatch.rating}`);
          }
        }
      } catch (err) {
        console.warn(`[Report] Failed to update business rating:`, err);
        // Non-blocking error
      }
    }

  } catch (error: any) {
    console.error(`Error generating report for business ${business.name}:`, error);

    throw error;
  }

  // Only save report if not a temporary business
  if (!providedBusiness) {
    const insertReport: InsertReport = {
      businessId: business.id,
      businessName: business.name,
      competitors,
      aiAnalysis: "Structured Analysis", // Placeholder text or summary
      executiveSummary: aiAnalysis.executiveSummary,
      // Map structured fields
      swotAnalysis: aiAnalysis.swot,
      marketTrends: aiAnalysis.marketTrends,
      targetAudience: aiAnalysis.targetAudience,
      marketingStrategy: aiAnalysis.marketingStrategy,
      customerSentiment: aiAnalysis.customerSentiment,
      // HTML field is not used for new reports as we use structured data
      html: undefined,
      userId: userId || null,
      radius: radius || undefined,
    };

    const report = await storage.saveReport(insertReport);
    return report;
  }

  // For temporary businesses, return report without saving
  return {
    id: 'temp-' + Date.now(),
    businessId: business.id,
    businessName: business.name,
    competitors,
    aiAnalysis: "Structured Analysis",
    executiveSummary: aiAnalysis.executiveSummary,
    swotAnalysis: aiAnalysis.swot,
    marketTrends: aiAnalysis.marketTrends,
    targetAudience: aiAnalysis.targetAudience,
    marketingStrategy: aiAnalysis.marketingStrategy,
    customerSentiment: aiAnalysis.customerSentiment,
    html: null,
    generatedAt: new Date(),
    userId: null,
    radius: radius || null,
  } as Report;
}




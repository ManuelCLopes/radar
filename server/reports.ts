import { randomUUID } from "crypto";
import { storage } from "./storage";
import { searchNearby } from "./googlePlaces";
import { analyzeCompetitors } from "./ai";
import type { Report, Business, InsertReport } from "@shared/schema";

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

  let userPlan = "essential";
  if (userId) {
    const user = await storage.getUser(userId);
    if (user) {
      userPlan = user.plan;
    }
  }

  const competitors = await searchNearby(
    business.latitude,
    business.longitude,
    business.type,
    radius,
    true, // Always include reviews
    language
  );

  /*
   * For new reports, we get a structured object.
   * We no longer generate a monolithic HTML string for storage.
   * However, for temporary display or legacy compatibility in other parts of the system,
   * we might need to handle it.
   */
  const aiAnalysis = await analyzeCompetitors(business, competitors, language, userPlan);

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
      // Leave HTML empty as requested ("instead saving the html code")
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

function generateReportHTML(
  business: Business,
  competitors: { name: string; address: string; rating?: number; userRatingsTotal?: number; priceLevel?: string }[],
  aiAnalysis: any, // Changed to any to accept structured data
  language: string = "en",
  radius: number
): string {
  // This function is kept for reference or legacy reasons if we ever need to re-generate HTML on the server.
  // But strictly speaking, we are moving to client-side rendering of structured data.
  // If we really need HTML returned for some API (e.g. non-DB based), we would need to rewrite this to render the structured data.
  return "";
}


import type { Business, Competitor } from "@shared/schema";
import OpenAI from "openai";
import { storage } from "./storage";

const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-local-dev";

console.log("[OpenAI] API Key configured:", apiKey !== "dummy-key-for-local-dev" ? "✅ YES (starts with " + apiKey.substring(0, 7) + "...)" : "❌ NO - using fallback");

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: apiKey,
});


const languageNames: Record<string, string> = {
  en: "English",
  pt: "Portuguese (Portugal)",
  es: "Spanish",
  fr: "French",
  de: "German",
};

export interface StructuredAnalysis {
  executiveSummary: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  marketTrends: string[];
  targetAudience: {
    demographics: string;
    psychographics: string;
    painPoints: string;
  };
  marketingStrategy: {
    primaryChannels: string;
    contentIdeas: string;
    promotionalTactics: string;
  };
  customerSentiment: {
    commonPraises: string[];
    recurringComplaints: string[];
    unmetNeeds: string[];
  };
}

export async function analyzeCompetitors(
  business: Business,
  competitors: Competitor[],
  language: string = "en",
  plan: string = "essential"
): Promise<StructuredAnalysis> {
  // Normalize language code (e.g. "pt-BR" -> "pt")
  const normalizedLang = language.split('-')[0].toLowerCase();
  const languageName = languageNames[normalizedLang] || languageNames[language] || "English";

  const totalCompetitors = competitors.length;
  const avgRating = totalCompetitors > 0
    ? competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length
    : 0;

  if (totalCompetitors === 0) {
    return generateFallbackAnalysis(business, competitors, language);
  }

  const competitorsSummary = competitors.map((c, i) => {
    let summary = `${i + 1}. ${c.name} - Rating: ${c.rating || "N/A"}/5 (${c.userRatingsTotal || 0} reviews), Price Level: ${c.priceLevel || "Unknown"}, Distance: ${c.distance || "Unknown"}, Address: ${c.address}`;
    if (c.reviews && c.reviews.length > 0) {
      summary += `\n   Recent Reviews:\n   - "${c.reviews.map(r => r.text).join('"\n   - "')}"`;
    }
    return summary;
  }).join("\n\n");


  const prompt = `You are an expert business strategist specializing in local market competition analysis.
  Analyze the following business and its competitors to provide a strategic report in JSON format.

  Target Business:
  Name: ${business.name}
  Type: ${business.type}
  Address: ${business.address}

  Competitors (Sorted by distance):
  ${competitorsSummary}

  Average Competitor Rating: ${avgRating.toFixed(1)}/5

  Language: ${languageName}

  CRITICAL INSTRUCTIONS:
  1. Return ONLY valid JSON. No other text or markdown.
  2. All content MUST be in ${languageName}.
  3. Be specific and actionable.
  4. Use the following JSON structure:
  {
    "executiveSummary": "Detailed market overview and competitive landscape summary...",
    "swot": {
      "strengths": ["Title: Description", ...],
      "weaknesses": ["Title: Description", ...],
      "opportunities": ["Title: Description", ...],
      "threats": ["Title: Description", ...]
    },
    "marketTrends": ["Trend: Impact on business", ...],
    "targetAudience": {
      "demographics": "Detailed paragraph describing the demographic profile...",
      "psychographics": "Detailed paragraph describing consumer behavior and values...",
      "painPoints": "Detailed paragraph describing customer needs and problems..."
    },
    "marketingStrategy": {
      "primaryChannels": "Detailed paragraph describing best channels...",
      "contentIdeas": "Detailed paragraph describing content themes...",
      "promotionalTactics": "Detailed paragraph describing tactical offers..."
    },
    "customerSentiment": {
      "commonPraises": ["string", "string", ...],
      "recurringComplaints": ["string", "string", ...],
      "unmetNeeds": ["string", "string", ...]
    }
  }
  
  IMPORTANT:
  - 'targetAudience' and 'marketingStrategy' fields must be rich NARRATIVE PARAGRAPHS, not lists.
  - 'executiveSummary' should specificially cover the Market Overview.
  - 'swot' and 'marketTrends' items should follow "Title: Description" format for better readability.
  `;

  try {
    console.log("[OpenAI] Making API call for business:", business.name);
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that outputs only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Log API usage
    if (response.usage) {
      await storage.trackApiUsage({
        service: 'openai',
        endpoint: 'chatCompletions',
        tokens: response.usage.total_tokens,
        costUnits: Math.ceil((response.usage.total_tokens || 0) / 1000) // Rough cost approximation
      });
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const aiAnalysis = JSON.parse(content) as StructuredAnalysis;
    console.log("[OpenAI] ✅ Successfully generated analysis");
    return aiAnalysis;

  } catch (error) {
    console.error("[OpenAI] ❌ Error calling OpenAI:", error);
    return generateFallbackAnalysis(business, competitors, language);
  }
}

function generateFallbackAnalysis(business: Business, competitors: Competitor[], language: string = "en"): StructuredAnalysis {
  const normalizedLang = language.split('-')[0].toLowerCase();

  const noCompetitors = competitors.length === 0;

  // Basic fallback data structure
  return {
    executiveSummary: "This is a generated fallback analysis due to an error. The business is located in a competitive area.",
    swot: {
      strengths: noCompetitors ? ["Prime location opportunity: No direct competitors nearby."] : ["Location: Good visibility.", "Service potential: Space for high quality service."],
      weaknesses: ["Brand awareness: New entrant in the market."],
      opportunities: ["Digital marketing: Expand online presence."],
      threats: ["Economic factors: Market uncertainty."]
    },
    marketTrends: ["Digital Adoption: Growing preference for online interaction."],
    targetAudience: {
      demographics: "Local residents looking for convenience and quality.",
      psychographics: "Value-conscious consumers who appreciate good service.",
      painPoints: "Finding reliable and high-quality options nearby."
    },
    marketingStrategy: {
      primaryChannels: "Social media platforms like Instagram and Facebook to reach local community.",
      contentIdeas: "Behind-the-scenes content and customer testimonials.",
      promotionalTactics: "Grand opening discounts and loyalty programs."
    },
    customerSentiment: {
      commonPraises: ["Friendly service"],
      recurringComplaints: ["Wait times"],
      unmetNeeds: ["Delivery options"]
    }
  };
}

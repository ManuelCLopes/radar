import type { Business, Competitor } from "../shared/schema.js";
import OpenAI from "openai";
import { storage } from "./storage.js";

const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-local-dev";
const hasApiKey = apiKey !== "dummy-key-for-local-dev";

// gpt-6-luna is OpenAI's recommended replacement for gpt-4o-mini (shut down on
// 2027-01-14): cheaper per token and a newer model. It is a reasoning model, so
// it takes reasoning_effort/max_completion_tokens and no temperature.
export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";
// Used only if the primary model rejects the request (unknown model or
// parameter), so a misconfiguration degrades to the previous model instead of
// to the static fallback report.
const LEGACY_AI_MODEL = "gpt-4o-mini";
// "low" gives noticeably better analysis for ~$0.0005 more per report than
// "none"; set OPENAI_REASONING_EFFORT=none for the cheapest option.
const REASONING_EFFORTS = ["none", "low", "medium", "high"] as const;
type ReasoningEffort = typeof REASONING_EFFORTS[number];
const configuredEffort = process.env.OPENAI_REASONING_EFFORT as ReasoningEffort | undefined;
export const AI_REASONING_EFFORT: ReasoningEffort =
  configuredEffort && REASONING_EFFORTS.includes(configuredEffort) ? configuredEffort : "low";

console.log("[OpenAI] API Key configured:", hasApiKey ? "✅ YES" : "❌ NO - using fallback", "| model:", AI_MODEL, "| reasoning:", AI_REASONING_EFFORT);

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
    demographics: {
      ageRange: string;
      gender: string;
      incomeLevel: string;
    };
    psychographics: string;
    painPoints: string[];
  };
  marketingStrategy: {
    channels: string[];
    contentIdeas: string;
    tactics: string[];
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
  plan: string = "essential",
  userId: string | null = null
): Promise<StructuredAnalysis> {
  // Normalize language code (e.g. "pt-BR" -> "pt")
  const normalizedLang = language.split('-')[0].toLowerCase();
  const languageName = languageNames[normalizedLang] || languageNames[language] || "English";

  const totalCompetitors = competitors.length;
  const avgRating = totalCompetitors > 0
    ? competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length
    : 0;

  // No competitors (a real result) or no API key (local development): the
  // template analysis is the intended output.
  if (totalCompetitors === 0 || !hasApiKey) {
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
      "demographics": {
        "ageRange": "e.g., 25-45",
        "gender": "e.g., All genders",
        "incomeLevel": "e.g., Medium-High"
      },
      "psychographics": "Detailed paragraph describing consumer behavior and values...",
      "painPoints": ["Point 1", "Point 2", "Point 3"]
    },
    "marketingStrategy": {
      "channels": ["Channel 1", "Channel 2"],
      "contentIdeas": "Detailed paragraph describing content themes...",
      "tactics": ["Tactic 1", "Tactic 2"]
    },
    "customerSentiment": {
      "commonPraises": ["string", "string", ...],
      "recurringComplaints": ["string", "string", ...],
      "unmetNeeds": ["string", "string", ...]
    }
  }
  
  IMPORTANT:
  - 'targetAudience.demographics' must be an OBJECT with specific fields.
  - 'targetAudience.painPoints' must be an ARRAY of strings.
  - 'marketingStrategy.channels' and 'marketingStrategy.tactics' must be ARRAYS of strings.
  - 'executiveSummary' should specificially cover the Market Overview.
  - 'swot' and 'marketTrends' items should follow "Title: Description" format for better readability.
  `;

  const messages = [
    {
      role: "system" as const,
      content: "You are a helpful assistant that outputs only valid JSON."
    },
    {
      role: "user" as const,
      content: prompt
    }
  ];

  try {
    console.log("[OpenAI] Making API call for business:", business.name);
    let response;
    try {
      response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages,
        response_format: { type: "json_schema", json_schema: analysisJsonSchema },
        reasoning_effort: AI_REASONING_EFFORT,
        // Covers reasoning tokens plus the ~2-4k token report.
        max_completion_tokens: 16000,
      });
    } catch (error) {
      if (!isRejectedRequest(error) || AI_MODEL === LEGACY_AI_MODEL) throw error;
      console.error(`[OpenAI] ${AI_MODEL} rejected the request, retrying with ${LEGACY_AI_MODEL}:`, error);
      response = await openai.chat.completions.create({
        model: LEGACY_AI_MODEL,
        messages,
        response_format: { type: "json_object" },
        max_tokens: 4000,
        temperature: 0.7,
      });
    }

    // Log API usage
    if (response.usage) {
      await storage.trackApiUsage({
        service: 'openai',
        endpoint: 'chatCompletions',
        userId,
        tokens: response.usage.total_tokens,
        costUnits: Math.ceil((response.usage.total_tokens || 0) / 1000) // Rough cost approximation
      });
    }

    const choice = response.choices[0];
    if (choice?.finish_reason === "length") {
      throw new Error("OpenAI response was cut off before the analysis was complete");
    }
    if (choice?.message?.refusal) {
      throw new Error(`OpenAI refused the request: ${choice.message.refusal}`);
    }
    const content = choice?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const aiAnalysis = JSON.parse(content) as StructuredAnalysis;
    console.log("[OpenAI] ✅ Successfully generated analysis");
    return aiAnalysis;

  } catch (error) {
    // Surface the failure: callers mark the report as failed so the user can
    // retry, instead of receiving a generic template presented as analysis.
    console.error("[OpenAI] ❌ Error calling OpenAI:", error);
    throw error;
  }
}

function isRejectedRequest(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 400 || status === 404;
}

const stringArray = { type: "array", items: { type: "string" } } as const;

// Mirrors StructuredAnalysis. Strict mode guarantees every report has every
// section with the right types, so the UI never has to guess.
export const analysisJsonSchema = {
  name: "competitor_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["executiveSummary", "swot", "marketTrends", "targetAudience", "marketingStrategy", "customerSentiment"],
    properties: {
      executiveSummary: { type: "string" },
      swot: {
        type: "object",
        additionalProperties: false,
        required: ["strengths", "weaknesses", "opportunities", "threats"],
        properties: {
          strengths: stringArray,
          weaknesses: stringArray,
          opportunities: stringArray,
          threats: stringArray,
        },
      },
      marketTrends: stringArray,
      targetAudience: {
        type: "object",
        additionalProperties: false,
        required: ["demographics", "psychographics", "painPoints"],
        properties: {
          demographics: {
            type: "object",
            additionalProperties: false,
            required: ["ageRange", "gender", "incomeLevel"],
            properties: {
              ageRange: { type: "string" },
              gender: { type: "string" },
              incomeLevel: { type: "string" },
            },
          },
          psychographics: { type: "string" },
          painPoints: stringArray,
        },
      },
      marketingStrategy: {
        type: "object",
        additionalProperties: false,
        required: ["channels", "contentIdeas", "tactics"],
        properties: {
          channels: stringArray,
          contentIdeas: { type: "string" },
          tactics: stringArray,
        },
      },
      customerSentiment: {
        type: "object",
        additionalProperties: false,
        required: ["commonPraises", "recurringComplaints", "unmetNeeds"],
        properties: {
          commonPraises: stringArray,
          recurringComplaints: stringArray,
          unmetNeeds: stringArray,
        },
      },
    },
  },
};

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
      demographics: {
        "ageRange": "25-45",
        "gender": "All",
        "incomeLevel": "Medium"
      },
      psychographics: "Value-conscious consumers who appreciate good service.",
      painPoints: ["Finding reliable options", "Quality assurance", "Convenience"]
    },
    marketingStrategy: {
      channels: ["Social Media", "Local Search", "Community Partnerships"],
      contentIdeas: "Behind-the-scenes content and customer testimonials.",
      tactics: ["Grand opening discounts", "Loyalty programs"]
    },
    customerSentiment: {
      commonPraises: ["Friendly service"],
      recurringComplaints: ["Wait times"],
      unmetNeeds: ["Delivery options"]
    }
  };
}

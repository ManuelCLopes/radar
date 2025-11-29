import type { Business, Competitor } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export async function analyzeCompetitors(
  business: Business,
  competitors: Competitor[]
): Promise<string> {
  const totalCompetitors = competitors.length;

  if (totalCompetitors === 0) {
    return `Great news! No direct competitors were found in the immediate vicinity of "${business.name}". This could indicate a potential market opportunity. However, we recommend expanding the search radius to ensure comprehensive market analysis.`;
  }

  const competitorsSummary = competitors.map((c, i) => 
    `${i + 1}. ${c.name} - Rating: ${c.rating || "N/A"}/5 (${c.userRatingsTotal || 0} reviews), Distance: ${c.distance || "Unknown"}, Address: ${c.address}`
  ).join("\n");

  const avgRating = competitors
    .filter(c => c.rating)
    .reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length;

  const totalReviews = competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0);

  const prompt = `You are a business strategy consultant analyzing local competition for a small business. Provide a comprehensive, actionable competitive analysis report.

BUSINESS DETAILS:
- Name: ${business.name}
- Type: ${business.type}
- Location: ${business.address || `Coordinates: ${business.latitude}, ${business.longitude}`}

NEARBY COMPETITORS (${totalCompetitors} found):
${competitorsSummary}

MARKET METRICS:
- Average competitor rating: ${avgRating ? avgRating.toFixed(1) : "N/A"}/5.0
- Total market reviews: ${totalReviews.toLocaleString()}

Please provide a detailed analysis including:
1. MARKET OVERVIEW - Summary of the competitive landscape
2. KEY COMPETITORS - Analysis of the top competitors and their strengths
3. MARKET GAPS - Opportunities where competitors may be underserving customers
4. STRATEGIC RECOMMENDATIONS - Specific, actionable steps to compete effectively
5. DIFFERENTIATION STRATEGIES - Ways to stand out from the competition
6. RISK ASSESSMENT - Potential challenges and how to mitigate them

Format your response with clear headers and bullet points for easy reading. Be specific and practical in your recommendations.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert business strategist specializing in local market competition analysis. Provide clear, actionable insights that help small businesses compete effectively in their local markets."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const aiAnalysis = response.choices[0]?.message?.content;
    
    if (!aiAnalysis) {
      console.error("No AI response received");
      return generateFallbackAnalysis(business, competitors);
    }

    return aiAnalysis;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return generateFallbackAnalysis(business, competitors);
  }
}

function generateFallbackAnalysis(business: Business, competitors: Competitor[]): string {
  const totalCompetitors = competitors.length;
  const avgRating = competitors
    .filter(c => c.rating)
    .reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length;
  
  const totalReviews = competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0);
  const avgReviews = Math.round(totalReviews / totalCompetitors);
  
  const highRatedCompetitors = competitors.filter(c => (c.rating || 0) >= 4.5);
  const lowRatedCompetitors = competitors.filter(c => (c.rating || 0) < 4.0);

  return `
COMPETITOR ANALYSIS REPORT FOR "${business.name.toUpperCase()}"
${"=".repeat(50)}

MARKET OVERVIEW:
We identified ${totalCompetitors} competitor(s) in your local area. Here's what you need to know:

KEY METRICS:
• Average competitor rating: ${avgRating ? avgRating.toFixed(1) : "N/A"}/5.0
• Average reviews per competitor: ${avgReviews}
• Total market reviews: ${totalReviews.toLocaleString()}

COMPETITIVE LANDSCAPE:
${highRatedCompetitors.length > 0 
  ? `• ${highRatedCompetitors.length} high-performing competitor(s) with ratings above 4.5 stars. These businesses have established strong customer loyalty.`
  : "• No competitors have ratings above 4.5 stars, presenting an opportunity to become the market leader in customer satisfaction."}

${lowRatedCompetitors.length > 0
  ? `• ${lowRatedCompetitors.length} competitor(s) with ratings below 4.0 stars. This indicates potential gaps in service quality that you can capitalize on.`
  : "• All competitors maintain ratings above 4.0 stars, indicating a competitive market with high service standards."}

STRATEGIC RECOMMENDATIONS:
1. Focus on customer service excellence to differentiate from competitors
2. Monitor competitor pricing and promotional strategies
3. Leverage online reviews and social media presence
4. Consider unique value propositions that set you apart
5. Build strong community relationships and local partnerships

OPPORTUNITIES:
${avgRating && avgRating < 4.2 
  ? "• The market shows room for improvement in customer satisfaction - aim to exceed current standards."
  : "• The market has high satisfaction standards - focus on innovation and unique offerings."}
• Consider targeted marketing to capture customers from lower-rated competitors
• Develop loyalty programs to retain customers in this competitive environment

This analysis is based on current market data and should be reviewed periodically to track market changes.
`.trim();
}

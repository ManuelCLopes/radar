import type { Business, Competitor } from "@shared/schema";

export async function analyzeCompetitors(
  business: Business,
  competitors: Competitor[]
): Promise<string> {
  const totalCompetitors = competitors.length;
  
  if (totalCompetitors === 0) {
    return `Great news! No direct competitors were found in the immediate vicinity of "${business.name}". This could indicate a potential market opportunity. However, we recommend expanding the search radius to ensure comprehensive market analysis.`;
  }

  const avgRating = competitors
    .filter(c => c.rating)
    .reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length;
  
  const totalReviews = competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0);
  const avgReviews = Math.round(totalReviews / totalCompetitors);
  
  const highRatedCompetitors = competitors.filter(c => (c.rating || 0) >= 4.5);
  const lowRatedCompetitors = competitors.filter(c => (c.rating || 0) < 4.0);

  const analysis = `
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

[Note: This is a mock analysis. Connect a real AI service (OpenAI, Anthropic, etc.) for more detailed insights.]
`.trim();

  return analysis;
}

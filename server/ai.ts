import type { Business, Competitor } from "@shared/schema";
import OpenAI from "openai";

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

export async function analyzeCompetitors(
  business: Business,
  competitors: Competitor[],
  language: string = "en",
  plan: string = "essential"
): Promise<string> {
  const totalCompetitors = competitors.length;
  // Normalize language code (e.g. "pt-BR" -> "pt")
  const normalizedLang = language.split('-')[0].toLowerCase();
  const languageName = languageNames[normalizedLang] || languageNames[language] || "English";

  if (totalCompetitors === 0) {
    const noCompetitorMessages: Record<string, string> = {
      en: `Great news! No direct competitors were found in the immediate vicinity of "${business.name}". This could indicate a potential market opportunity. However, we recommend expanding the search radius to ensure comprehensive market analysis.`,
      pt: `Ótimas notícias! Não foram encontrados concorrentes diretos nas imediações de "${business.name}". Isto pode indicar uma oportunidade de mercado potencial. No entanto, recomendamos expandir o raio de pesquisa para garantir uma análise de mercado abrangente.`,
      es: `¡Buenas noticias! No se encontraron competidores directos en las inmediaciones de "${business.name}". Esto podría indicar una oportunidad de mercado potencial. Sin embargo, recomendamos ampliar el radio de búsqueda para garantizar un análisis de mercado integral.`,
      fr: `Bonne nouvelle ! Aucun concurrent direct n'a été trouvé à proximité immédiate de "${business.name}". Cela pourrait indiquer une opportunité de marché potentielle. Cependant, nous recommandons d'élargir le rayon de recherche pour assurer une analyse de marché complète.`,
      de: `Gute Nachrichten! In der unmittelbaren Umgebung von "${business.name}" wurden keine direkten Wettbewerber gefunden. Dies könnte auf eine potenzielle Marktchance hindeuten. Wir empfehlen jedoch, den Suchradius zu erweitern, um eine umfassende Marktanalyse sicherzustellen.`,
    };
    return noCompetitorMessages[language] || noCompetitorMessages.en;
  }

  const competitorsSummary = competitors.map((c, i) => {
    let summary = `${i + 1}. ${c.name} - Rating: ${c.rating || "N/A"}/5 (${c.userRatingsTotal || 0} reviews), Price Level: ${c.priceLevel || "Unknown"}, Distance: ${c.distance || "Unknown"}, Address: ${c.address}`;
    if (c.reviews && c.reviews.length > 0) {
      summary += `\n   Recent Reviews:\n   - "${c.reviews.map(r => r.text).join('"\n   - "')}"`;
    }
    return summary;
  }).join("\n\n");

  const avgRating = competitors
    .filter(c => c.rating)
    .reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length;

  const totalReviews = competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0);

  const isAdvanced = true;

  const headers = {
    en: {
      marketOverview: "MARKET OVERVIEW",
      swot: "SWOT ANALYSIS",
      strengths: "Strengths",
      weaknesses: "Weaknesses",
      opportunities: "Opportunities",
      threats: "Threats",
      trends: "MARKET TRENDS",
      audience: "TARGET AUDIENCE PERSONA",
      marketing: "MARKETING STRATEGY",
      keyCompetitors: "KEY COMPETITORS",
      reviewAnalysis: "REVIEW THEME ANALYSIS",
      marketGaps: "MARKET GAPS",
      recommendations: "PRACTICAL RECOMMENDATIONS",
      differentiation: "DIFFERENTIATION STRATEGIES",
      customerSentiment: "CUSTOMER SENTIMENT & REVIEW INSIGHTS",
      commonPraises: "Common Praises",
      recurringComplaints: "Recurring Complaints",
      unmetNeeds: "Unmet Needs",
      demographics: "Demographics",
      psychographics: "Psychographics",
      painPoints: "Pain Points & Needs",
      primaryChannels: "Primary Channels",
      contentIdeas: "Content Ideas",
      promotionalTactics: "Promotional Tactics"
    },
    pt: {
      marketOverview: "VISÃO GERAL DO MERCADO",
      swot: "ANÁLISE SWOT",
      strengths: "Pontos Fortes",
      weaknesses: "Pontos Fracos",
      opportunities: "Oportunidades",
      threats: "Ameaças",
      trends: "TENDÊNCIAS DE MERCADO",
      audience: "PERSONA DO PÚBLICO-ALVO",
      marketing: "ESTRATÉGIA DE MARKETING",
      keyCompetitors: "PRINCIPAIS CONCORRENTES",
      reviewAnalysis: "ANÁLISE DE TEMAS DE AVALIAÇÃO",
      marketGaps: "LACUNAS DE MERCADO",
      recommendations: "RECOMENDAÇÕES PRÁTICAS",
      differentiation: "ESTRATÉGIAS DE DIFERENCIAÇÃO",
      customerSentiment: "SENTIMENTO DO CLIENTE & INSIGHTS DE AVALIAÇÕES",
      commonPraises: "Elogios Comuns",
      recurringComplaints: "Reclamações Recorrentes",
      unmetNeeds: "Necessidades Não Atendidas",
      demographics: "Demografia",
      psychographics: "Psicografia",
      painPoints: "Dores e Necessidades",
      primaryChannels: "Canais Principais",
      contentIdeas: "Ideias de Conteúdo",
      promotionalTactics: "Táticas Promocionais"
    },
    es: {
      marketOverview: "VISIÓN GENERAL DEL MERCADO",
      swot: "ANÁLISIS DAFO",
      strengths: "Fortalezas",
      weaknesses: "Debilidades",
      opportunities: "Oportunidades",
      threats: "Amenazas",
      trends: "TENDENCIAS DEL MERCADO",
      audience: "PERSONA DEL PÚBLICO OBJETIVO",
      marketing: "ESTRATEGIA DE MARKETING",
      keyCompetitors: "COMPETIDORES CLAVE",
      reviewAnalysis: "ANÁLISIS DE TEMAS DE RESEÑAS",
      marketGaps: "BRECHAS DE MERCADO",
      recommendations: "RECOMENDACIONES PRÁCTICAS",
      differentiation: "ESTRATEGIAS DE DIFERENCIACIÓN",
      customerSentiment: "SENTIMIENTO DEL CLIENTE E INSIGHTS DE RESEÑAS",
      commonPraises: "Elogios Comunes",
      recurringComplaints: "Quejas Recurrentes",
      unmetNeeds: "Necesidades Insatisfechas",
      demographics: "Demografía",
      psychographics: "Psicografía",
      painPoints: "Puntos de Dolor y Necesidades",
      primaryChannels: "Canales Principales",
      contentIdeas: "Ideas de Contenido",
      promotionalTactics: "Tácticas Promocionales"
    },
    fr: {
      marketOverview: "APERÇU DU MARCHÉ",
      swot: "ANALYSE SWOT",
      strengths: "Forces",
      weaknesses: "Faiblesses",
      opportunities: "Opportunités",
      threats: "Menaces",
      trends: "TENDANCES DU MARCHÉ",
      audience: "PERSONA DU PUBLIC CIBLE",
      marketing: "STRATÉGIE MARKETING",
      keyCompetitors: "PRINCIPAUX CONCURRENTS",
      reviewAnalysis: "ANALYSE DES THÈMES DES AVIS",
      marketGaps: "LACUNES DU MARCHÉ",
      recommendations: "RECOMMANDATIONS PRATIQUES",
      differentiation: "STRATÉGIES DE DIFFÉRENCIATION",
      customerSentiment: "SENTIMENT CLIENT & ANALYSE DES AVIS",
      commonPraises: "Éloges Courants",
      recurringComplaints: "Plaintes Récurrentes",
      unmetNeeds: "Besoins Non Satisfaits",
      demographics: "Démographie",
      psychographics: "Psychographie",
      painPoints: "Points de Douleur et Besoins",
      primaryChannels: "Canaux Principaux",
      contentIdeas: "Idées de Contenu",
      promotionalTactics: "Tactiques Promotionnelles"
    },
    de: {
      marketOverview: "MARKTÜBERSICHT",
      swot: "SWOT-ANALYSE",
      strengths: "Stärken",
      weaknesses: "Schwächen",
      opportunities: "Chancen",
      threats: "Bedrohungen",
      trends: "MARKTRENDS",
      audience: "ZIELGRUPPEN-PERSONA",
      marketing: "MARKETINGSTRATEGIE",
      keyCompetitors: "WICHTIGSTE WETTBEWERBER",
      reviewAnalysis: "ANALYSE DER BEWERTUNGSTHEMEN",
      marketGaps: "MARKT-LÜCKEN",
      recommendations: "PRAKTISCHE EMPFEHLUNGEN",
      differentiation: "DIFFERENZIERUNGSSTRATEGIEN",
      customerSentiment: "KUNDENSTIMMUNG & BEWERTUNGSEINBLICKE",
      commonPraises: "Häufiges Lob",
      recurringComplaints: "Wiederkehrende Beschwerden",
      unmetNeeds: "Unerfüllte Bedürfnisse",
      demographics: "Demografie",
      psychographics: "Psychografie",
      painPoints: "Schmerzpunkte und Bedürfnisse",
      primaryChannels: "Hauptkanäle",
      contentIdeas: "Inhaltsideen",
      promotionalTactics: "Werbetaktiken"
    }
  };

  const h = headers[normalizedLang as keyof typeof headers] || headers.en;

  let prompt = `You are a business strategy consultant analyzing local competition for a small business. Provide a comprehensive, actionable competitive analysis report.

IMPORTANT: Write your entire response in ${languageName}. All text, headers, and recommendations must be in ${languageName}.

FORMATTING: Output your response as HTML. Use semantic HTML tags with Tailwind CSS classes for styling:
- Use <h2 class="text-2xl font-bold text-primary mb-4 flex items-center gap-2"> for main section headers
- Use <h3 class="text-lg font-semibold mb-3 text-foreground/90 border-l-4 border-primary/30 pl-3"> for sub-section headers
- Use <h4 class="text-base font-medium mb-2 text-foreground/80"> for sub-sub-section headers
- Use <p class="my-3 text-foreground/80 leading-relaxed"> for paragraphs
- Use <ul class="my-3 space-y-2"> for unordered lists
- Use <ol class="my-3 space-y-2"> for ordered lists
- Use <li class="text-foreground/80 pl-2"> for list items
- Use <strong class="text-primary font-semibold"> for emphasis
- Use <em class="text-foreground/70 italic"> for slight emphasis
- Use <hr class="my-6 border-muted"> for section separators
- Do NOT include <html>, <head>, or <body> tags - only the content

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
1. ${h.marketOverview} - Summary of the competitive landscape and how ${business.name} compares to competitors
2. ${h.swot} - Detailed analysis of Strengths, Weaknesses, Opportunities, and Threats (use <h3> for each subsection)
3. ${h.keyCompetitors} - Analysis of the top competitors, their strengths, ratings, and price positioning
4. ${h.reviewAnalysis} - Based on the "Recent Reviews" provided, analyze what themes likely dominate customer feedback. QUOTE specific phrases from reviews to support your points (e.g., "As noted in a review for [Competitor], customers appreciate...").
5. ${h.marketGaps} - Opportunities where competitors may be underserving customers`;

  if (isAdvanced) {
    prompt = `
  You are an expert business consultant specializing in local market analysis.
  Analyze the following business and its competitors to provide a strategic report.
  
  Target Business:
  Name: ${business.name}
  Type: ${business.type}
  Address: ${business.address}
  
  Competitors (Sorted by distance):
  ${competitorsSummary}
  
  Average Competitor Rating: ${avgRating.toFixed(1)}/5
  
  Generate a report in ${languageName} language.
  
  CRITICAL INSTRUCTIONS:
  1.  **FORMATTING**: Output as HTML using semantic tags with Tailwind CSS classes. Use <strong class="font-semibold"> for emphasis. Use <h2> for main sections and <h3> for sub-sections. Use <ul> and <li> for lists.
  2.  **REVIEW ANALYSIS**: You MUST analyze the "Recent Reviews" provided. Do NOT just list them. Synthesize them into actionable insights. Identify patterns in customer satisfaction and dissatisfaction.
  3.  **DETAIL**: Be extensive and specific. Avoid generic advice.
  4.  **HEADERS**: You MUST use the exact section headers provided below.
  
  Structure the response as HTML with the following sections:
  
  <h2 class="text-lg font-semibold mt-4 mb-2">${h.marketOverview}</h2>
  <p class="my-2">Provide a comprehensive summary of the competitive landscape and how ${business.name} compares to competitors.</p>

  <h2 class="text-lg font-semibold mt-4 mb-2">${h.swot}</h2>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.strengths}</h3>
  <ul class="list-disc list-inside space-y-1 my-2">
    <li>Analyze 3-5 key strengths. Use <strong class="font-semibold"> for the main point of each bullet</li>
  </ul>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.weaknesses}</h3>
  <ul class="list-disc list-inside space-y-1 my-2">
    <li>Analyze 3-5 key weaknesses. Use <strong> for the main point</li>
  </ul>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.opportunities}</h3>
  <ul class="list-disc list-inside space-y-1 my-2">
    <li>Analyze 3-5 opportunities. Use <strong> for the main point. Add <strong>Strategic Implication:</strong> Explain how to capture this</li>
  </ul>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.threats}</h3>
  <ul class="list-disc list-inside space-y-1 my-2">
    <li>Analyze 3-5 threats. Use <strong> for the main point. Add <strong>Strategic Implication:</strong> Explain how to mitigate this</li>
  </ul>
  
  <h2 class="text-lg font-semibold mt-4 mb-2">${h.trends}</h2>
  <p class="my-2">Identify 3-5 current trends in this specific niche/location. For each trend, explain the <strong>Business Impact</strong> and reference any relevant competitor reviews that validate this trend</p>
  
  <h2 class="text-lg font-semibold mt-4 mb-2">${h.customerSentiment}</h2>
  <p class="my-2">Synthesize the competitor reviews into key themes</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.commonPraises}</h3>
  <p class="my-2">What are competitors doing well? e.g., "Friendly staff", "Tasty food"</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.recurringComplaints}</h3>
  <p class="my-2">What are the common pain points? e.g., "Long wait times", "High prices"</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.unmetNeeds}</h3>
  <p class="my-2">What are customers asking for that they aren't getting?</p>
  
  <h2 class="text-lg font-semibold mt-4 mb-2">${h.audience}</h2>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.demographics}</h3>
  <p class="my-2">Age, Income, Location, etc.</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.psychographics}</h3>
  <p class="my-2">Interests, Values, Lifestyle</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.painPoints}</h3>
  <p class="my-2">What problems are they trying to solve?</p>
  
  <h2 class="text-lg font-semibold mt-4 mb-2">${h.marketing}</h2>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.primaryChannels}</h3>
  <p class="my-2">Best channels to reach this audience</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.contentIdeas}</h3>
  <p class="my-2">Specific content themes and topics</p>
  <h3 class="text-base font-semibold mt-3 mb-2">${h.promotionalTactics}</h3>
  <p class="my-2">Actionable ideas to drive traffic</p>
  
  IMPORTANT: Be EXTENSIVE and DETAILED. Use in-depth paragraphs for the Market Overview and Competitor Analysis. Avoid generic advice; provide specific, tailored insights based on the location and business type.
  Remember: Write everything in ${languageName}. Do NOT include <html>, <head>, or <body> tags.
  `;
  } else {
    // Append common sections for basic plan
    prompt += `
6. ${h.recommendations} - Specific, actionable steps for the next month (use <h2> and <ul> with <li> tags)
7. ${h.differentiation} - Ways to stand out from the competition (use <h2> and <ul> with <li> tags)

Format your response as HTML with proper semantic tags and Tailwind CSS classes as shown above. Use <h2 class="text-lg font-semibold mt-4 mb-2"> for section headers, <p class="my-2"> for paragraphs, and <ul class="list-disc list-inside space-y-1 my-2"> for lists.
IMPORTANT: Be EXTENSIVE and DETAILED. Use in-depth paragraphs for the Market Overview and Competitor Analysis. Avoid generic advice; provide specific, tailored insights based on the location and business type.
Remember: Write everything in ${languageName}. Output HTML only (no <html>, <head>, or <body> tags).`;
  }

  try {
    console.log("[OpenAI] Making API call for business:", business.name);
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert business strategist specializing in local market competition analysis.Provide clear, actionable, and extensive insights that help small businesses compete effectively.Always respond in ${languageName}.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const aiAnalysis = response.choices[0]?.message?.content;

    if (!aiAnalysis) {
      console.error("[OpenAI] ❌ No AI response received");
      return generateFallbackAnalysis(business, competitors, language);
    }

    console.log("[OpenAI] ✅ Successfully generated analysis (" + aiAnalysis.length + " characters)");
    return aiAnalysis;
  } catch (error) {
    console.error("[OpenAI] ❌ Error calling OpenAI:", error);
    return generateFallbackAnalysis(business, competitors, language);
  }
}

function generateFallbackAnalysis(business: Business, competitors: Competitor[], language: string = "en"): string {
  const totalCompetitors = competitors.length;
  const avgRating = competitors
    .filter(c => c.rating)
    .reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.filter(c => c.rating).length;

  const totalReviews = competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0);
  const avgReviews = Math.round(totalReviews / totalCompetitors);

  const highRatedCompetitors = competitors.filter(c => (c.rating || 0) >= 4.5);
  const lowRatedCompetitors = competitors.filter(c => (c.rating || 0) < 4.0);

  const translations: Record<string, any> = {
    en: {
      title: "COMPETITOR ANALYSIS REPORT FOR",
      fallbackNote: "⚠️ BASIC ANALYSIS (OpenAI not configured)",
      marketOverview: "MARKET OVERVIEW",
      overviewText: `We identified ${totalCompetitors} competitor(s) in your local area.Here's what you need to know:`,
      keyMetrics: "KEY METRICS",
      avgRating: "Average competitor rating",
      avgReviews: "Average reviews per competitor",
      totalReviews: "Total market reviews",
      landscape: "COMPETITIVE LANDSCAPE",
      highRated: {
        found: `• ${highRatedCompetitors.length} high-performing competitor(s) with ratings above 4.5 stars. These businesses have established strong customer loyalty.`,
        none: "• No competitors have ratings above 4.5 stars, presenting an opportunity to become the market leader in customer satisfaction."
      },
      lowRated: {
        found: `• ${lowRatedCompetitors.length} competitor(s) with ratings below 4.0 stars. This indicates potential gaps in service quality that you can capitalize on.`,
        none: "• All competitors maintain ratings above 4.0 stars, indicating a competitive market with high service standards."
      },
      recommendations: "STRATEGIC RECOMMENDATIONS",
      recList: [
        "Focus on customer service excellence to differentiate from competitors",
        "Monitor competitor pricing and promotional strategies",
        "Leverage online reviews and social media presence",
        "Consider unique value propositions that set you apart",
        "Build strong community relationships and local partnerships"
      ],
      opportunities: "OPPORTUNITIES",
      oppRating: {
        low: "• The market shows room for improvement in customer satisfaction - aim to exceed current standards.",
        high: "• The market has high satisfaction standards - focus on innovation and unique offerings."
      },
      oppList: [
        "• Consider targeted marketing to capture customers from lower-rated competitors",
        "• Develop loyalty programs to retain customers in this competitive environment"
      ],
      disclaimer: "This analysis is based on current market data and should be reviewed periodically to track market changes.",
      recentReviews: "RECENT REVIEWS (Top Competitors)"
    },
    pt: {
      title: "RELATÓRIO DE ANÁLISE DE CONCORRÊNCIA PARA",
      fallbackNote: "⚠️ ANÁLISE BÁSICA (OpenAI não configurada)",
      marketOverview: "VISÃO GERAL DO MERCADO",
      overviewText: `Identificámos ${totalCompetitors} concorrente(s) na sua área local. Aqui está o que precisa de saber:`,
      keyMetrics: "MÉTRICAS PRINCIPAIS",
      avgRating: "Classificação média dos concorrentes",
      avgReviews: "Média de avaliações por concorrente",
      totalReviews: "Total de avaliações do mercado",
      landscape: "CENÁRIO COMPETITIVO",
      highRated: {
        found: `• ${highRatedCompetitors.length} concorrente(s) de alto desempenho com classificações acima de 4,5 estrelas. Estes negócios estabeleceram uma forte fidelidade dos clientes.`,
        none: "• Nenhum concorrente tem classificações acima de 4,5 estrelas, apresentando uma oportunidade para se tornar o líder de mercado em satisfação do cliente."
      },
      lowRated: {
        found: `• ${lowRatedCompetitors.length} concorrente(s) com classificações abaixo de 4,0 estrelas. Isto indica potenciais lacunas na qualidade do serviço que pode aproveitar.`,
        none: "• Todos os concorrentes mantêm classificações acima de 4,0 estrelas, indicando um mercado competitivo com elevados padrões de serviço."
      },
      recommendations: "RECOMENDAÇÕES ESTRATÉGICAS",
      recList: [
        "Foque na excelência do serviço ao cliente para se diferenciar da concorrência",
        "Monitorize os preços e estratégias promocionais dos concorrentes",
        "Aproveite as avaliações online e a presença nas redes sociais",
        "Considere propostas de valor únicas que o destaquem",
        "Construya relacionamentos fortes com a comunidade e parcerias locais"
      ],
      opportunities: "OPORTUNIDADES",
      oppRating: {
        low: "• O mercado mostra espaço para melhorias na satisfação do cliente - procure exceder os padrões atuais.",
        high: "• O mercado tem elevados padrões de satisfação - foque na inovação e ofertas únicas."
      },
      oppList: [
        "• Considere marketing direcionado para captar clientes de concorrentes com classificações mais baixas",
        "• Desenvolva programas de fidelização para reter clientes neste ambiente competitivo"
      ],
      disclaimer: "Esta análise baseia-se em dados atuais do mercado e deve ser revista periodicamente para acompanhar as mudanças do mercado.",
      recentReviews: "AVALIAÇÕES RECENTES (Principais Concorrentes)"
    },
    es: {
      title: "INFORME DE ANÁLISIS DE COMPETENCIA PARA",
      fallbackNote: "⚠️ ANÁLISIS BÁSICO (OpenAI no configurada)",
      marketOverview: "VISIÓN GENERAL DEL MERCADO",
      overviewText: `Identificamos ${totalCompetitors} competidor(es) en su área local. Esto es lo que necesita saber:`,
      keyMetrics: "MÉTRICAS CLAVE",
      avgRating: "Calificación promedio de competidores",
      avgReviews: "Promedio de reseñas por competidor",
      totalReviews: "Total de reseñas del mercado",
      landscape: "PAISAJE COMPETITIVO",
      highRated: {
        found: `• ${highRatedCompetitors.length} competidor(es) de alto rendimiento con calificaciones superiores a 4.5 estrellas. Estos negocios han establecido una fuerte lealtad del cliente.`,
        none: "• Ningún competidor tiene calificaciones superiores a 4.5 estrellas, presentando una oportunidad para convertirse en el líder del mercado en satisfacción del cliente."
      },
      lowRated: {
        found: `• ${lowRatedCompetitors.length} competidor(es) con calificaciones inferiores a 4.0 estrellas. Esto indica posibles brechas en la calidad del servicio que puede aprovechar.`,
        none: "• Todos los competidores mantienen calificaciones superiores a 4.0 estrellas, indicando un mercado competitivo con altos estándares de servicio."
      },
      recommendations: "RECOMENDACIONES ESTRATÉGICAS",
      recList: [
        "Céntrese en la excelencia del servicio al cliente para diferenciarse de la competencia",
        "Monitoree los precios y estrategias promocionales de la competencia",
        "Aproveche las reseñas en línea y la presencia en redes sociales",
        "Considere propuestas de valor únicas que lo distingan",
        "Construya relaciones sólidas con la comunidad y asociaciones locales"
      ],
      opportunities: "OPORTUNIDADES",
      oppRating: {
        low: "• El mercado muestra espacio para mejoras en la satisfacción del cliente - intente superar los estándares actuales.",
        high: "• El mercado tiene altos estándares de satisfacción - céntrese en la innovación y ofertas únicas."
      },
      oppList: [
        "• Considere marketing dirigido para captar clientes de competidores con calificaciones más bajas",
        "• Desarrolle programas de fidelización para retener clientes en este entorno competitivo"
      ],
      disclaimer: "Este análisis se basa en datos actuales del mercado y debe revisarse periódicamente para seguir los cambios del mercado.",
      recentReviews: "RESEÑAS RECIENTES (Principales Competidores)"
    },
    fr: {
      title: "RAPPORT D'ANALYSE DE LA CONCURRENCE POUR",
      fallbackNote: "⚠️ ANALYSE DE BASE (OpenAI non configurée)",
      marketOverview: "APERÇU DU MARCHÉ",
      overviewText: `Nous avons identifié ${totalCompetitors} concurrent(s) dans votre zone locale. Voici ce que vous devez savoir :`,
      keyMetrics: "MÉTRIQUES CLÉS",
      avgRating: "Note moyenne des concurrents",
      avgReviews: "Moyenne des avis par concurrent",
      totalReviews: "Total des avis du marché",
      landscape: "PAYSAGE CONCURRENTIEL",
      highRated: {
        found: `• ${highRatedCompetitors.length} concurrent(s) très performant(s) avec des notes supérieures à 4,5 étoiles. Ces entreprises ont établi une forte fidélité client.`,
        none: "• Aucun concurrent n'a de notes supérieures à 4,5 étoiles, ce qui présente une opportunité de devenir le leader du marché en matière de satisfaction client."
      },
      lowRated: {
        found: `• ${lowRatedCompetitors.length} concurrent(s) avec des notes inférieures à 4,0 étoiles. Cela indique des lacunes potentielles dans la qualité du service que vous pouvez exploiter.`,
        none: "• Tous les concurrents maintiennent des notes supérieures à 4,0 étoiles, indiquant un marché concurrentiel avec des normes de service élevées."
      },
      recommendations: "RECOMMANDATIONS STRATÉGIQUES",
      recList: [
        "Concentrez-vous sur l'excellence du service client pour vous différencier de la concurrence",
        "Surveillez les prix et les stratégies promotionnelles des concurrents",
        "Tirez parti des avis en ligne et de la présence sur les réseaux sociaux",
        "Envisagez des propositions de valeur uniques qui vous distinguent",
        "Établissez des relations solides avec la communauté et des partenariats locaux"
      ],
      opportunities: "OPPORTUNITÉS",
      oppRating: {
        low: "• Le marché montre une marge d'amélioration de la satisfaction client - visez à dépasser les normes actuelles.",
        high: "• Le marché a des normes de satisfaction élevées - concentrez-vous sur l'innovation et les offres uniques."
      },
      oppList: [
        "• Envisagez un marketing ciblé pour capter les clients des concurrents moins bien notés",
        "• Développez des programmes de fidélité pour retenir les clients dans cet environnement concurrentiel"
      ],
      disclaimer: "Cette analyse est basée sur les données actuelles du marché et doit être revue périodiquement pour suivre les évolutions du marché.",
      recentReviews: "AVIS RÉCENTS (Principaux Concurrents)"
    },
    de: {
      title: "WETTBEWERBSANALYSEBERICHT FÜR",
      fallbackNote: "⚠️ BASISANALYSE (OpenAI nicht konfiguriert)",
      marketOverview: "MARKTÜBERSICHT",
      overviewText: `Wir haben ${totalCompetitors} Wettbewerber in Ihrer Umgebung identifiziert. Hier ist, was Sie wissen müssen:`,
      keyMetrics: "WICHTIGE KENNZAHLEN",
      avgRating: "Durchschnittliche Bewertung der Wettbewerber",
      avgReviews: "Durchschnittliche Bewertungen pro Wettbewerber",
      totalReviews: "Gesamte Marktbewertungen",
      landscape: "WETTBEWERBSLANDSCHAFT",
      highRated: {
        found: `• ${highRatedCompetitors.length} leistungsstarke(r) Wettbewerber mit Bewertungen über 4,5 Sternen. Diese Unternehmen haben eine starke Kundenbindung aufgebaut.`,
        none: "• Keine Wettbewerber haben Bewertungen über 4,5 Sternen, was eine Gelegenheit bietet, Marktführer bei der Kundenzufriedenheit zu werden."
      },
      lowRated: {
        found: `• ${lowRatedCompetitors.length} Wettbewerber mit Bewertungen unter 4,0 Sternen. Dies deutet auf potenzielle Lücken in der Servicequalität hin, die Sie nutzen können.`,
        none: "• Alle Wettbewerber halten Bewertungen über 4,0 Sternen, was auf einen wettbewerbsintensiven Markt mit hohen Servicestandards hinweist."
      },
      recommendations: "STRATEGISCHE EMPFEHLUNGEN",
      recList: [
        "Konzentrieren Sie sich auf exzellenten Kundenservice, um sich von der Konkurrenz abzuheben",
        "Überwachen Sie die Preis- und Werbestrategien der Wettbewerber",
        "Nutzen Sie Online-Bewertungen und Social-Media-Präsenz",
        "Erwägen Sie einzigartige Wertversprechen, die Sie abheben",
        "Bauen Sie starke Beziehungen zur Gemeinschaft und lokale Partnerschaften auf"
      ],
      opportunities: "CHANCEN",
      oppRating: {
        low: "• Der Markt zeigt Raum für Verbesserungen bei der Kundenzufriedenheit - zielen Sie darauf ab, die aktuellen Standards zu übertreffen.",
        high: "• Der Markt hat hohe Zufriedenheitsstandards - konzentrieren Sie sich auf Innovation und einzigartige Angebote."
      },
      oppList: [
        "• Erwägen Sie gezieltes Marketing, um Kunden von schlechter bewerteten Wettbewerbern zu gewinnen",
        "• Entwickeln Sie Treueprogramme, um Kunden in diesem wettbewerbsintensiven Umfeld zu binden"
      ],
      disclaimer: "Diese Analyse basiert auf aktuellen Marktdaten und sollte regelmäßig überprüft werden, um Marktveränderungen zu verfolgen.",
      recentReviews: "AKTUELLE BEWERTUNGEN (Top-Wettbewerber)"
    }
  };

  // Normalize language code (e.g. "pt-BR" -> "pt")
  const normalizedLang = language.split('-')[0].toLowerCase();
  const t = translations[normalizedLang] || translations[language] || translations.en;

  let reviewsSection = "";
  const topCompetitors = competitors.slice(0, 3);

  if (topCompetitors.some(c => c.reviews && c.reviews.length > 0)) {
    reviewsSection = `<h2 class="text-lg font-semibold mt-4 mb-2">${t.recentReviews}</h2>`;
    topCompetitors.forEach(c => {
      if (c.reviews && c.reviews.length > 0) {
        const rating = c.rating || 0;
        let sentiment = "";

        if (rating >= 4.8) {
          sentiment = normalizedLang === 'pt' ? "Excelência Excecional - Feedback consistentemente positivo." :
            normalizedLang === 'es' ? "Excelencia Excepcional - Comentarios consistentemente positivos." :
              normalizedLang === 'fr' ? "Excellence Exceptionnelle - Commentaires constamment positifs." :
                normalizedLang === 'de' ? "Außergewöhnliche Exzellenz - Durchweg positives Feedback." :
                  "Exceptional Excellence - Consistently positive feedback.";
        } else if (rating >= 4.5) {
          sentiment = normalizedLang === 'pt' ? "Muito Forte - Alta satisfação do cliente." :
            normalizedLang === 'es' ? "Muy Fuerte - Alta satisfacción del cliente." :
              normalizedLang === 'fr' ? "Très Fort - Grande satisfaction client." :
                normalizedLang === 'de' ? "Sehr Stark - Hohe Kundenzufriedenheit." :
                  "Very Strong - High customer satisfaction.";
        } else if (rating >= 4.0) {
          sentiment = normalizedLang === 'pt' ? "Bom Desempenho - Geralmente positivo, mas com espaço para melhorias." :
            normalizedLang === 'es' ? "Buen Rendimiento - Generalmente positivo, pero con margen de mejora." :
              normalizedLang === 'fr' ? "Bonne Performance - Généralement positif, mais avec une marge d'amélioration." :
                normalizedLang === 'de' ? "Gute Leistung - Im Allgemeinen positiv, aber mit Verbesserungspotenzial." :
                  "Good Performance - Generally positive but room for improvement.";
        } else {
          sentiment = normalizedLang === 'pt' ? "Misto/Variável - Experiências inconsistentes reportadas." :
            normalizedLang === 'es' ? "Mixto/Variable - Experiencias inconsistentes reportadas." :
              normalizedLang === 'fr' ? "Mixte/Variable - Expériences incohérentes signalées." :
                normalizedLang === 'de' ? "Gemischt/Variabel - Inkonsistente Erfahrungen gemeldet." :
                  "Mixed/Variable - Inconsistent experiences reported.";
        }

        reviewsSection += `<p class="my-2"><strong class="font-semibold">${c.name}</strong> (${rating.toFixed(1)}/5)</p>`;
        reviewsSection += `<p class="my-1">${sentiment}</p>`;
      }
    });
  }

  return `
<h2 class="text-lg font-semibold mt-4 mb-2">${t.title} "${business.name.toUpperCase()}"</h2>
<div class="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4">
  <p class="text-sm font-semibold text-yellow-700 dark:text-yellow-400">${t.fallbackNote}</p>
</div>
<hr class="my-4 border-muted" />
<h2 class="text-lg font-semibold mt-4 mb-2">${t.marketOverview}</h2>
<p class="my-2">${t.overviewText}</p>
<h3 class="text-base font-semibold mt-3 mb-2">${t.keyMetrics}</h3>
<ul class="list-disc list-inside space-y-1 my-2">
  <li><strong class="font-semibold">${t.avgRating}:</strong> ${avgRating ? avgRating.toFixed(1) : "N/A"}/5.0</li>
  <li><strong class="font-semibold">${t.avgReviews}:</strong> ${avgReviews}</li>
  <li><strong class="font-semibold">${t.totalReviews}:</strong> ${totalReviews.toLocaleString()}</li>
</ul>
<h3 class="text-base font-semibold mt-3 mb-2">${t.landscape}</h3>
<p class="my-2">${highRatedCompetitors.length > 0 ? t.highRated.found : t.highRated.none}</p>
<p class="my-2">${lowRatedCompetitors.length > 0 ? t.lowRated.found : t.lowRated.none}</p>
<h2 class="text-lg font-semibold mt-4 mb-2">${t.recommendations}</h2>
<ol class="list-decimal list-inside space-y-1 my-2">
  ${t.recList.map((rec: string) => `<li>${rec}</li>`).join('\n  ')}
</ol>
<h2 class="text-lg font-semibold mt-4 mb-2">${t.opportunities}</h2>
<p class="my-2">${avgRating && avgRating < 4.2 ? t.oppRating.low : t.oppRating.high}</p>
<ul class="list-disc list-inside space-y-1 my-2">
  ${t.oppList.map((opp: string) => `<li>${opp.replace(/^• /, '')}</li>`).join('\n  ')}
</ul>
${reviewsSection}
<hr class="my-4 border-muted" />
<p class="my-2"><em>${t.disclaimer}</em></p>
`.trim();
}

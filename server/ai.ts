import type { Business, Competitor } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-local-dev",
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

  const isAdvanced = plan === 'professional' || plan === 'agency';

  let prompt = `You are a business strategy consultant analyzing local competition for a small business. Provide a comprehensive, actionable competitive analysis report.

IMPORTANT: Write your entire response in ${languageName}. All text, headers, and recommendations must be in ${languageName}.

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
1. MARKET OVERVIEW - Summary of the competitive landscape and how ${business.name} compares to competitors
2. KEY COMPETITORS - Analysis of the top competitors, their strengths, ratings, and price positioning
3. REVIEW THEME ANALYSIS - Based on the "Recent Reviews" provided, analyze what themes likely dominate customer feedback. **QUOTE** specific phrases from reviews to support your points (e.g., "As noted in a review for [Competitor], customers appreciate...").
4. MARKET GAPS - Opportunities where competitors may be underserving customers`;

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
  1.  **FORMATTING**: Use **Bold** for key terms and important metrics. Use \`###\` for sub-headings within sections to organize content. Use bullet points for readability.
  2.  **REVIEW ANALYSIS**: You MUST analyze the "Recent Reviews" provided. Do NOT just list them. **Synthesize** them into actionable insights. Identify patterns in customer satisfaction and dissatisfaction.
  3.  **DETAIL**: Be extensive and specific. Avoid generic advice.
  
  Structure the response in Markdown with the following sections:
  
  # SWOT ANALYSIS
  ## Strengths
  (Analyze 3-5 key strengths. Use **bold** for the main point of each bullet)
  ## Weaknesses
  (Analyze 3-5 key weaknesses. Use **bold** for the main point)
  ## Opportunities
  (Analyze 3-5 opportunities. Use **bold** for the main point. **Strategic Implication**: Explain how to capture this)
  ## Threats
  (Analyze 3-5 threats. Use **bold** for the main point. **Strategic Implication**: Explain how to mitigate this)
  
  # MARKET TRENDS
  (Identify 3-5 current trends in this specific niche/location. For each trend, explain the **Business Impact** and reference any relevant competitor reviews that validate this trend)
  
  # CUSTOMER SENTIMENT & REVIEW INSIGHTS
  (Synthesize the competitor reviews into key themes)
  ## Common Praises
  (What are competitors doing well? e.g., "Friendly staff", "Tasty food")
  ## Recurring Complaints
  (What are the common pain points? e.g., "Long wait times", "High prices")
  ## Unmet Needs
  (What are customers asking for that they aren't getting?)
  
  # TARGET AUDIENCE PERSONA
  ## Demographics
  (Age, Income, Location, etc.)
  ## Psychographics
  (Interests, Values, Lifestyle)
  ## Pain Points & Needs
  (What problems are they trying to solve?)
  
  # MARKETING STRATEGY
  ## Primary Channels
  (Best channels to reach this audience)
  ## Content Ideas
  (Specific content themes and topics)
  ## Promotional Tactics
  (Actionable ideas to drive traffic)
  
  IMPORTANT: Be EXTENSIVE and DETAILED. Use in-depth paragraphs for the Market Overview and Competitor Analysis. Avoid generic advice; provide specific, tailored insights based on the location and business type.
  Remember: Write everything in ${languageName}.
  `;
  } else {
    // Append common sections for basic plan
    prompt += `
5. 3-5 PRACTICAL RECOMMENDATIONS - Specific, actionable steps for the next month.
6. DIFFERENTIATION STRATEGIES - Ways to stand out from the competition.

Format your response with clear headers and bullet points.
IMPORTANT: Be EXTENSIVE and DETAILED. Use in-depth paragraphs for the Market Overview and Competitor Analysis. Avoid generic advice; provide specific, tailored insights based on the location and business type.
Remember: Write everything in ${languageName}.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert business strategist specializing in local market competition analysis. Provide clear, actionable, and extensive insights that help small businesses compete effectively. Always respond in ${languageName}.`
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
      console.error("No AI response received");
      return generateFallbackAnalysis(business, competitors, language);
    }

    return aiAnalysis;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
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
      marketOverview: "MARKET OVERVIEW",
      overviewText: `We identified ${totalCompetitors} competitor(s) in your local area. Here's what you need to know:`,
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
    reviewsSection = `\n${t.recentReviews}:\n`;
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

        reviewsSection += `\n**${c.name}** (${rating.toFixed(1)}/5)\n`;
        reviewsSection += `• ${sentiment}\n`;
      }
    });
  }

  return `
# ${t.title} "${business.name.toUpperCase()}"
---
## ${t.marketOverview}
${t.overviewText}
## ${t.keyMetrics}
• **${t.avgRating}**: ${avgRating ? avgRating.toFixed(1) : "N/A"}/5.0
• **${t.avgReviews}**: ${avgReviews}
• **${t.totalReviews}**: ${totalReviews.toLocaleString()}
## ${t.landscape}
${highRatedCompetitors.length > 0 ? t.highRated.found : t.highRated.none}
${lowRatedCompetitors.length > 0 ? t.lowRated.found : t.lowRated.none}
## ${t.recommendations}
${t.recList.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
## ${t.opportunities}
${avgRating && avgRating < 4.2 ? t.oppRating.low : t.oppRating.high}
${t.oppList.join('\n')}
${reviewsSection ? `\n## ${t.recentReviews}\n` + reviewsSection.replace(`${t.recentReviews}:\n`, '') : ''}
---
*${t.disclaimer}*
`.trim();
}

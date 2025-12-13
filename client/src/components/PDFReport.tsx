import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Report } from "@shared/schema";

// Register fonts - Disabled due to 404 errors on Google Fonts URLs
// Using standard Helvetica instead

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    section: {
        marginBottom: 15,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#1F2937',
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
        paddingLeft: 6,
        backgroundColor: '#F3F4F6',
        paddingVertical: 4,
    },
    subSectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: '#374151',
        marginTop: 6,
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    text: {
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.5,
        marginBottom: 4,
    },
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#F3F4F6',
        padding: 15,
        borderRadius: 8,
    },
    metricBox: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 20,
        fontWeight: 700,
        color: '#2563EB',
    },
    metricLabel: {
        fontSize: 10,
        color: '#4B5563',
        marginTop: 4,
    },
    competitorCard: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    competitorName: {
        fontSize: 11,
        fontWeight: 600,
        color: '#111827',
    },
    competitorMeta: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    },
    swotContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    swotBox: {
        width: '48%',
        padding: 20,
        marginBottom: 8,
        borderRadius: 4,
        backgroundColor: '#F9FAFB',
    },
    swotTitle: {
        fontSize: 11,
        fontWeight: 700,
        marginBottom: 4,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 3,
        height: 3,
        borderRadius: 2, // Fixed: React-PDF doesn't support percentage
        marginTop: 4,
        marginRight: 5,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    gridItem: {
        width: '48%',
        marginBottom: 10,
    },
    fullWidthItem: {
        width: '100%',
        marginBottom: 10,
    }
});

interface PDFReportProps {
    report: Report;
    t: (key: string, options?: any) => string;
}

export const PDFReport = ({ report, t }: PDFReportProps) => {
    const competitors = report.competitors || [];
    const avgRating = competitors.length > 0
        ? competitors.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / (competitors.filter(c => c.rating).length || 1)
        : 0;

    const totalReviews = competitors.reduce((sum, c) => sum + (c.userRatingsTotal || 0), 0);

    // Helper to extract list items from HTML content
    const extractListItems = (text: string, sectionTitle: string) => {
        if (!text) return [];
        const sectionRegex = new RegExp(`<h[23][^>]*>(\\d+\\.\\s*)?(${sectionTitle})</h[23]>[\\s\\S]*?<ul[^>]*>([\\s\\S]*?)</ul>`, 'i');
        const match = text.match(sectionRegex);

        if (!match) return [];

        const listContentStr = match[3];
        const items = listContentStr.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        return items.map(item => item.replace(/<[^>]*>/g, '').trim());
    };

    // Helper to extract text content from a section
    const extractSectionText = (sectionTitle: string) => {
        if (!report.aiAnalysis) return '';
        const regex = new RegExp(`<h[23][^>]*>(\\d+\\.\\s*)?(${sectionTitle})</h[23]>([\\s\\S]*?)(?=<h[23]|$)`, 'i');
        const match = report.aiAnalysis.match(regex);
        if (!match) return '';
        return match[3].replace(/<[^>]*>/g, '').trim();
    };

    // Helper to extract complex nested sections (like Target Audience)
    const extractComplexSection = (text: string, mainSectionTitle: string, subSections: string[]) => {
        if (!text) return {};
        const result: Record<string, string[]> = {};

        // Find the main section start
        const mainSectionRegex = new RegExp(`<h[23][^>]*>(\\d+\\.\\s*)?(${mainSectionTitle})</h[23]>([\\s\\S]*?)(?=<h2|$)`, 'i');
        const mainMatch = text.match(mainSectionRegex);

        if (!mainMatch) return result;
        const content = mainMatch[3];

        subSections.forEach(sub => {
            // Look for subsection header followed by content (p or ul)
            const subRegex = new RegExp(`<h[34][^>]*>(\\d+\\.\\s*)?(${sub})</h[34]>([\\s\\S]*?)(?=<h[34]|$)`, 'i');
            const subMatch = content.match(subRegex);

            if (subMatch) {
                const subContent = subMatch[2];
                // Check if it's a list
                if (subContent.includes('<ul')) {
                    const items = subContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
                    result[sub] = items.map(item => item.replace(/<[^>]*>/g, '').trim());
                } else {
                    // It's a paragraph
                    result[sub] = [subContent.replace(/<[^>]*>/g, '').trim()];
                }
            }
        });
        return result;
    };

    const text = report.aiAnalysis || '';

    // Parse Sections
    const strengths = extractListItems(text, 'Strengths|Pontos Fortes|Fortalezas|Forces|Stärken|Forças');
    const weaknesses = extractListItems(text, 'Weaknesses|Pontos Fracos|Debilidades|Faiblesses|Schwächen|Fraquezas');
    const opportunities = extractListItems(text, 'Opportunities|Oportunidades|Opportunités|Chancen');
    const threats = extractListItems(text, 'Threats|Ameaças|Amenazas|Menaces|Bedrohungen');

    // Parse Market Overview
    let marketOverview = extractSectionText('MARKET OVERVIEW|VISÃO GERAL DO MERCADO|VISIÓN GENERAL DEL MERCADO|APERÇU DU MARCHÉ|MARKTÜBERSICHT|Visão Geral do Mercado');
    if (!marketOverview) {
        const firstHeaderIndex = text.search(/<h[23]/);
        if (firstHeaderIndex > 0) {
            marketOverview = text.substring(0, firstHeaderIndex).replace(/<[^>]*>/g, '').trim();
        }
    }

    // Parse Market Trends
    const marketTrends = extractListItems(text, 'MARKET TRENDS|TENDÊNCIAS DE MERCADO|TENDENCIAS DEL MERCADO|TENDANCES DU MARCHÉ|MARKTRENDS');

    // Parse Customer Sentiment
    const customerSentiment = extractComplexSection(text, 'CUSTOMER SENTIMENT & REVIEW INSIGHTS|SENTIMENTO DO CLIENTE & INSIGHTS DE AVALIAÇÕES|SENTIMIENTO DEL CLIENTE E INSIGHTS DE RESEÑAS|SENTIMENT CLIENT & ANALYSE DES AVIS|KUNDENSTIMMUNG & BEWERTUNGSEINBLICKE', [
        'Common Praises|Elogios Comuns|Elogios Comunes|Éloges Courants|Häufiges Lob',
        'Recurring Complaints|Reclamações Recorrentes|Quejas Recurrentes|Plaintes Récurrentes|Wiederkehrende Beschwerden',
        'Unmet Needs|Necessidades Não Atendidas|Necesidades Insatisfechas|Besoins Non Satisfaits|Unerfüllte Bedürfnisse'
    ]);

    // Parse Target Audience
    const targetAudience = extractComplexSection(text, 'TARGET AUDIENCE PERSONA|PERSONA DO PÚBLICO-ALVO|PERSONA DEL PÚBLICO OBJETIVO|PERSONA DU PUBLIC CIBLE|ZIELGRUPPEN-PERSONA', [
        'Demographics|Demografia|Demografía|Démographie|Demografie',
        'Psychographics|Psicografia|Psicografía|Psychographie|Psychografie',
        'Pain Points & Needs|Dores e Necessidades|Pontos de Dor e Necessidades|Puntos de Dolor y Necesidades|Points de Douleur et Besoins|Schmerzpunkte und Bedürfnisse'
    ]);

    // Parse Marketing Strategy
    const marketingStrategy = extractComplexSection(text, 'MARKETING STRATEGY|ESTRATÉGIA DE MARKETING|ESTRATEGIA DE MARKETING|STRATÉGIE MARKETING|MARKETINGSTRATEGIE', [
        'Primary Channels|Canais Principais|Canales Principales|Canaux Principaux|Hauptkanäle',
        'Content Ideas|Ideias de Conteúdo|Ideas de Contenido|Idées de Contenu|Inhaltsideen',
        'Promotional Tactics|Táticas Promocionais|Tácticas Promocionales|Tactiques Promotionnelles|Werbetaktiken'
    ]);

    // Parse Additional Sections (Basic Plan)
    const keyCompetitors = extractSectionText('KEY COMPETITORS|PRINCIPAIS CONCORRENTES|COMPETIDORES CLAVE|PRINCIPAUX CONCURRENTS|WICHTIGSTE WETTBEWERBER');
    const reviewAnalysis = extractSectionText('REVIEW THEME ANALYSIS|ANÁLISE DE TEMAS DE AVALIAÇÃO|ANÁLISIS DE TEMAS DE RESEÑAS|ANALYSE DES THÈMES DES AVIS|ANALYSE DER BEWERTUNGSTHEMEN');
    const marketGaps = extractSectionText('MARKET GAPS|LACUNAS DE MERCADO|BRECHAS DE MERCADO|LACUNES DU MARCHÉ|MARKT-LÜCKEN');
    const recommendations = extractListItems(text, 'PRACTICAL RECOMMENDATIONS|RECOMENDAÇÕES PRÁTICAS|RECOMENDACIONES PRÁCTICAS|RECOMMANDATIONS PRATIQUES|PRAKTISCHE EMPFEHLUNGEN');
    const differentiation = extractListItems(text, 'DIFFERENTIATION STRATEGIES|ESTRATÉGIAS DE DIFERENCIAÇÃO|ESTRATEGIAS DE DIFERENCIACIÓN|STRATÉGIES DE DIFFÉRENCIATION|DIFFERENZIERUNGSSTRATEGIEN');

    // Helper to map keys to translations
    const getTranslatedKey = (key: string) => {
        const normalizedKey = key.split('|')[0];
        const keyMap: Record<string, string> = {
            'Demographics': 'demographics',
            'Psychographics': 'psychographics',
            'Pain Points & Needs': 'painPoints',
            'Primary Channels': 'primaryChannels',
            'Content Ideas': 'contentIdeas',
            'Promotional Tactics': 'promotionalTactics',
            'Common Praises': 'commonPraises',
            'Recurring Complaints': 'recurringComplaints',
            'Unmet Needs': 'unmetNeeds'
        };
        const translationKey = keyMap[normalizedKey];
        return translationKey ? t(`report.sections.${translationKey}`) : normalizedKey;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t("report.view.title")}</Text>
                    <Text style={styles.subtitle}>{report.businessName} • {new Date(report.generatedAt).toLocaleDateString()}</Text>
                </View>

                {/* Key Metrics */}
                <View style={styles.metricsContainer}>
                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{report.competitors.length}</Text>
                        <Text style={styles.metricLabel}>{t("report.stats.competitorsFound")}</Text>
                    </View>
                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</Text>
                        <Text style={styles.metricLabel}>{t("report.stats.avgRating")}</Text>
                    </View>
                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{totalReviews.toLocaleString()}</Text>
                        <Text style={styles.metricLabel}>{t("report.stats.totalReviews")}</Text>
                    </View>
                </View>

                {/* Market Overview */}
                {marketOverview && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.marketOverview") || "Market Overview"}</Text>
                        <Text style={styles.text}>{marketOverview}</Text>
                    </View>
                )}

                {/* Market Trends */}
                {marketTrends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.marketTrends")}</Text>
                        {marketTrends.map((item, i) => (
                            <View key={i} style={styles.bulletPoint}>
                                <View style={[styles.bullet, { backgroundColor: '#4B5563' }]} />
                                <Text style={styles.text}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Customer Sentiment */}
                {Object.keys(customerSentiment).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.customerSentiment")}</Text>
                        <View style={styles.gridContainer}>
                            {Object.entries(customerSentiment).map(([key, items]) => (
                                <View key={key} style={styles.fullWidthItem}>
                                    <Text style={styles.subSectionTitle}>{getTranslatedKey(key)}</Text>
                                    {items.map((item, i) => (
                                        <Text key={i} style={styles.text}>• {item}</Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Key Competitors (Basic Plan) */}
                {keyCompetitors && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.keyCompetitors") || "Key Competitors"}</Text>
                        <Text style={styles.text}>{keyCompetitors}</Text>
                    </View>
                )}

                {/* Review Analysis (Basic Plan) */}
                {reviewAnalysis && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.reviewAnalysis") || "Review Analysis"}</Text>
                        <Text style={styles.text}>{reviewAnalysis}</Text>
                    </View>
                )}

                {/* Market Gaps (Basic Plan) */}
                {marketGaps && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.marketGaps") || "Market Gaps"}</Text>
                        <Text style={styles.text}>{marketGaps}</Text>
                    </View>
                )}

                {/* Target Audience */}
                {Object.keys(targetAudience).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.targetAudience")}</Text>
                        <View style={styles.gridContainer}>
                            {Object.entries(targetAudience).map(([key, items]) => (
                                <View key={key} style={styles.gridItem}>
                                    <Text style={styles.subSectionTitle}>{getTranslatedKey(key)}</Text>
                                    {items.map((item, i) => (
                                        <Text key={i} style={styles.text}>• {item}</Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* SWOT Analysis */}
                {(strengths.length > 0 || weaknesses.length > 0) && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>{t("report.sections.swotAnalysis")}</Text>
                        <View style={styles.swotContainer}>
                            {strengths.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#F0FDF4' }]}>
                                    <Text style={[styles.swotTitle, { color: '#166534' }]}>{t("report.sections.strengths")}</Text>
                                    {strengths.map((item, i) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#166534' }]} />
                                            <Text style={styles.text}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {weaknesses.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#FEF2F2' }]}>
                                    <Text style={[styles.swotTitle, { color: '#991B1B' }]}>{t("report.sections.weaknesses")}</Text>
                                    {weaknesses.map((item, i) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#991B1B' }]} />
                                            <Text style={styles.text}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {opportunities.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#EFF6FF' }]}>
                                    <Text style={[styles.swotTitle, { color: '#1E40AF' }]}>{t("report.sections.opportunities")}</Text>
                                    {opportunities.map((item, i) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#1E40AF' }]} />
                                            <Text style={styles.text}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {threats.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#FFF7ED' }]}>
                                    <Text style={[styles.swotTitle, { color: '#9A3412' }]}>{t("report.sections.threats")}</Text>
                                    {threats.map((item, i) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#9A3412' }]} />
                                            <Text style={styles.text}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}


                {/* Marketing Strategy */}
                {Object.keys(marketingStrategy).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.marketingStrategy")}</Text>
                        <View style={styles.gridContainer}>
                            {Object.entries(marketingStrategy).map(([key, items]) => (
                                <View key={key} style={styles.fullWidthItem}>
                                    <Text style={styles.subSectionTitle}>{getTranslatedKey(key)}</Text>
                                    {items.map((item, i) => (
                                        <Text key={i} style={styles.text}>• {item}</Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Recommendations (Basic Plan) */}
                {recommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.recommendations") || "Recommendations"}</Text>
                        {recommendations.map((item, i) => (
                            <View key={i} style={styles.bulletPoint}>
                                <View style={[styles.bullet, { backgroundColor: '#4B5563' }]} />
                                <Text style={styles.text}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Differentiation (Basic Plan) */}
                {differentiation.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.differentiation") || "Differentiation Strategies"}</Text>
                        {differentiation.map((item, i) => (
                            <View key={i} style={styles.bulletPoint}>
                                <View style={[styles.bullet, { backgroundColor: '#4B5563' }]} />
                                <Text style={styles.text}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Competitors List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("report.sections.nearbyCompetitors")}</Text>
                    {report.competitors.slice(0, 10).map((competitor, i) => (
                        <View key={i} style={styles.competitorCard}>
                            <Text style={styles.competitorName}>{competitor.name} ({competitor.rating?.toFixed(1) || "N/A"} ★)</Text>
                            <Text style={styles.competitorMeta}>{competitor.address}</Text>
                            <Text style={styles.competitorMeta}>{competitor.userRatingsTotal || 0} reviews • {competitor.distance || "N/A"}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generated by Radar Local • {new Date().getFullYear()} • All Rights Reserved
                </Text>
            </Page>
        </Document>
    );
};

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
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
        borderRadius: 2,
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
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 4,
    },
    cardTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardContent: {
        paddingTop: 0,
    },
    fullWidthItem: {
        width: '100%',
        marginBottom: 10,
    },

    aiAnalysisCard: {
        backgroundColor: '#F0F9FF', // Light blue background (approximate for from-primary/5)
        borderRadius: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: '#BFDBFE', // Light blue border (approximate for border-primary/20)
        marginBottom: 20,
    },
    aiAnalysisTitle: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 10,
        color: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiAnalysisText: {
        fontSize: 10,
        lineHeight: 1.5,
        color: '#374151',
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

    // --- PARSING LOGIC COPIED FROM ReportView.tsx ---

    const swotRegex = /<h2[^>]*>(?:SWOT ANALYSIS|ANÁLISE SWOT|ANÁLISIS DAFO|ANALYSE SWOT|SWOT-ANALYSE)<\/h2>([\s\S]*?)(?=<h2|$)/i;
    const trendsRegex = /<h2[^>]*>(?:MARKET TRENDS|TENDÊNCIAS DE MERCADO|TENDENCIAS DEL MERCADO|TENDANCES DU MARCHÉ|MARKTRENDS)<\/h2>([\s\S]*?)(?=<h2|$)/i;
    const targetAudienceRegex = /<h2[^>]*>(?:TARGET AUDIENCE|PÚBLICO-ALVO|PÚBLICO OBJETIVO|PUBLIC CIBLE|ZIELGRUPPE)<\/h2>([\s\S]*?)(?=<h2|$)/i;
    const marketingRegex = /<h2[^>]*>(?:MARKETING STRATEGY|ESTRATÉGIA DE MARKETING|ESTRATEGIA DE MARKETING|STRATÉGIE MARKETING|MARKETINGSTRATEGIE)<\/h2>([\s\S]*?)(?=<h2|$)/i;
    const customerSentimentRegex = /<h2[^>]*>(?:CUSTOMER SENTIMENT & REVIEW INSIGHTS|SENTIMENTO DO CLIENTE & INSIGHTS DE AVALIAÇÕES|SENTIMIENTO DEL CLIENTE E INSIGHTS DE RESEÑAS|ANALYSE DES THÈMES DES AVIS|KUNDENSTIMMUNG & BEWERTUNGSEINBLICKE)<\/h2>([\s\S]*?)(?=<h2|$)/i;

    const swotMatch = report.aiAnalysis.match(swotRegex);
    const trendsMatch = report.aiAnalysis.match(trendsRegex);
    const targetAudienceMatch = report.aiAnalysis.match(targetAudienceRegex);
    const marketingMatch = report.aiAnalysis.match(marketingRegex);
    const customerSentimentMatch = report.aiAnalysis.match(customerSentimentRegex);

    let swotData = { strengths: [], weaknesses: [], opportunities: [], threats: [] } as any;
    let trendsData: string[] = [];
    let targetAudienceData = { demographics: [], psychographics: [], painPoints: [] } as any;
    let marketingData = { primaryChannels: [], contentIdeas: [], promotionalTactics: [] } as any;
    let customerSentimentData = { commonPraises: [], recurringComplaints: [], unmetNeeds: [] } as any;

    // Helper to render HTML text with basic styling (bold, italic)
    const RenderHtmlText = ({ text, style }: { text: string, style?: any }) => {
        if (!text) return null;

        // First, strip attributes from tags to simplify parsing (e.g. <strong class="..."> -> <strong>)
        // Also strip <p> tags as they shouldn't be rendered as text in this context
        const cleanText = text
            .replace(/<([a-z][a-z0-9]*)[^>]*>/gi, '<$1>')
            .replace(/<\/?p>/gi, '');

        // Split by tags
        const parts = cleanText.split(/(<\/?(?:strong|b|em|i)>)/g);

        let isBold = false;
        let isItalic = false;

        return (
            <Text style={style}>
                {parts.map((part, i) => {
                    if (part.match(/<(?:strong|b)>/i)) {
                        isBold = true;
                        return null;
                    }
                    if (part.match(/<\/(?:strong|b)>/i)) {
                        isBold = false;
                        return null;
                    }
                    if (part.match(/<(?:em|i)>/i)) {
                        isItalic = true;
                        return null;
                    }
                    if (part.match(/<\/(?:em|i)>/i)) {
                        isItalic = false;
                        return null;
                    }

                    if (!part) return null;

                    return (
                        <Text key={i} style={{
                            fontWeight: isBold ? 700 : 400,
                            fontStyle: isItalic ? 'italic' : 'normal',
                            color: isBold ? '#111827' : style?.color || '#374151'
                        }}>
                            {part}
                        </Text>
                    );
                })}
            </Text>
        );
    };

    // Helper to render main content with proper block structure
    const MainContentRenderer = ({ html, style }: { html: string, style?: any }) => {
        if (!html) return null;

        // 1. Clean attributes to simplify parsing
        const cleanHtml = html.replace(/<([a-z][a-z0-9]*)[^>]*>/gi, '<$1>');

        // 2. Split into blocks based on top-level tags we care about
        // We'll use a simple regex to find content between tags
        // This is not a full HTML parser but works for the expected structure
        const blocks: { type: string, content: string }[] = [];

        const regex = /<(h[23]|p|ul)>([\s\S]*?)<\/\1>/gi;
        let match;
        let lastIndex = 0;

        while ((match = regex.exec(cleanHtml)) !== null) {
            // Add any text before this block as a paragraph (if not empty)
            const preText = cleanHtml.substring(lastIndex, match.index).trim();
            if (preText) {
                blocks.push({ type: 'p', content: preText });
            }

            blocks.push({ type: match[1].toLowerCase(), content: match[2] });
            lastIndex = regex.lastIndex;
        }

        // Add remaining text
        const remaining = cleanHtml.substring(lastIndex).trim();
        if (remaining) {
            blocks.push({ type: 'p', content: remaining });
        }

        return (
            <View>
                {blocks.map((block, i) => {
                    if (block.type === 'h2') {
                        return (
                            <Text key={i} style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#111827',
                                marginTop: 10,
                                marginBottom: 6
                            }}>
                                {block.content.replace(/<[^>]+>/g, '')}
                            </Text>
                        );
                    }
                    if (block.type === 'h3') {
                        return (
                            <Text key={i} style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#374151',
                                marginTop: 8,
                                marginBottom: 4
                            }}>
                                {block.content.replace(/<[^>]+>/g, '')}
                            </Text>
                        );
                    }
                    if (block.type === 'ul') {
                        const items = block.content.match(/<li>([\s\S]*?)<\/li>/gi)?.map(li => li.replace(/<\/?li>/g, '').trim()) || [];
                        return (
                            <View key={i} style={{ marginBottom: 8 }}>
                                {items.map((item, j) => (
                                    <View key={j} style={{ flexDirection: 'row', marginBottom: 2, paddingLeft: 4 }}>
                                        <Text style={{ fontSize: 10, marginRight: 4 }}>•</Text>
                                        <RenderHtmlText text={item} style={style} />
                                    </View>
                                ))}
                            </View>
                        );
                    }
                    // Default to paragraph
                    return (
                        <View key={i} style={{ marginBottom: 8 }}>
                            <RenderHtmlText text={block.content} style={style} />
                        </View>
                    );
                })}
            </View>
        );
    };

    // Helper to clean HTML tags but keep formatting tags
    const cleanHtml = (html: string) => html.replace(/<\/?li[^>]*>/gi, '').trim();

    const extractListItems = (html: string) => {
        const listMatch = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
        if (listMatch) {
            return listMatch[1]
                .match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
                ?.map(item => cleanHtml(item)) || [];
        }
        return [];
    };

    if (swotMatch) {
        const swotContent = swotMatch[1];
        const sections = {
            strengths: /<h3[^>]*>(?:Strengths|Pontos Fortes|Fortalezas|Forces|Stärken)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            weaknesses: /<h3[^>]*>(?:Weaknesses|Pontos Fracos|Debilidades|Faiblesses|Schwächen)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            opportunities: /<h3[^>]*>(?:Opportunities|Oportunidades|Opportunités|Chancen)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            threats: /<h3[^>]*>(?:Threats|Ameaças|Amenazas|Menaces|Bedrohungen)<\/h3>([\s\S]*?)(?=<h3|$)/i
        };

        Object.entries(sections).forEach(([key, regex]) => {
            const match = swotContent.match(regex);
            if (match) {
                swotData[key] = extractListItems(match[1]);
            }
        });
    }

    if (trendsMatch) {
        trendsData = extractListItems(trendsMatch[1]);
    }

    if (targetAudienceMatch) {
        const content = targetAudienceMatch[1];
        const sections = {
            demographics: /<h3[^>]*>(?:Demographics|Demografia|Demografía|Démographie|Demografie)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            psychographics: /<h3[^>]*>(?:Psychographics|Psicografia|Psicografía|Psychographie|Psychografie)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            painPoints: /<h3[^>]*>(?:Pain Points|Dores|Puntos de Dolor|Points de Douleur|Schmerzpunkte)<\/h3>([\s\S]*?)(?=<h3|$)/i
        };

        Object.entries(sections).forEach(([key, regex]) => {
            const match = content.match(regex);
            if (match) {
                const text = cleanHtml(match[1]);
                if (text.startsWith('[')) {
                    targetAudienceData[key] = text.replace(/^\[|\]$/g, '').split(',').map(s => s.trim());
                } else {
                    targetAudienceData[key] = [text];
                }
            }
        });
    }

    if (marketingMatch) {
        const content = marketingMatch[1];
        const sections = {
            primaryChannels: /<h3[^>]*>(?:Primary Channels|Canais Principais|Canales Principales|Canaux Principaux|Hauptkanäle)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            contentIdeas: /<h3[^>]*>(?:Content Ideas|Ideias de Conteúdo|Ideas de Contenido|Idées de Contenu|Inhaltsideen)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            promotionalTactics: /<h3[^>]*>(?:Promotional Tactics|Táticas Promocionais|Tácticas Promocionales|Tactiques Promotionnelles|Werbetaktiken)<\/h3>([\s\S]*?)(?=<h3|$)/i
        };

        Object.entries(sections).forEach(([key, regex]) => {
            const match = content.match(regex);
            if (match) {
                const text = cleanHtml(match[1]);
                if (text.startsWith('[')) {
                    marketingData[key] = text.replace(/^\[|\]$/g, '').split(',').map(s => s.trim());
                } else {
                    marketingData[key] = [text];
                }
            }
        });
    }

    if (customerSentimentMatch) {
        const content = customerSentimentMatch[1];
        const sections = {
            commonPraises: /<h3[^>]*>(?:Common Praises|Elogios Comuns|Elogios Comunes|Éloges Courants|Häufiges Lob)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            recurringComplaints: /<h3[^>]*>(?:Recurring Complaints|Reclamações Recorrentes|Quejas Recurrentes|Plaintes Récurrentes|Wiederkehrende Beschwerden)<\/h3>([\s\S]*?)(?=<h3|$)/i,
            unmetNeeds: /<h3[^>]*>(?:Unmet Needs|Necessidades Não Atendidas|Necesidades Insatisfechas|Besoins Non Satisfaits|Unerfüllte Bedürfnisse)<\/h3>([\s\S]*?)(?=<h3|$)/i
        };

        Object.entries(sections).forEach(([key, regex]) => {
            const match = content.match(regex);
            if (match) {
                if (match[1].includes('<ul')) {
                    customerSentimentData[key] = extractListItems(match[1]);
                } else {
                    customerSentimentData[key] = [cleanHtml(match[1])];
                }
            }
        });
    }

    // Remove parsed sections from main content display
    const mainContent = report.aiAnalysis
        .replace(swotRegex, '')
        .replace(trendsRegex, '')
        .replace(targetAudienceRegex, '')
        .replace(marketingRegex, '')
        .replace(customerSentimentRegex, '')
        .trim(); // Removed .replace(/<[^>]*>/g, '') to keep HTML tags

    // Helper to map keys to translations
    const getTranslatedKey = (key: string) => {
        const normalizedKey = key.split('|')[0];
        const keyMap: Record<string, string> = {
            'Demographics': 'demographics',
            'Psychographics': 'psychographics',
            'Pain Points & Needs': 'painPoints',
            'Pain Points': 'painPoints',
            'Needs': 'painPoints',
            'Primary Channels': 'primaryChannels',
            'Content Ideas': 'contentIdeas',
            'Promotional Tactics': 'promotionalTactics',
            'Common Praises': 'commonPraises',
            'Recurring Complaints': 'recurringComplaints',
            'Unmet Needs': 'unmetNeeds'
        };

        // Handle camelCase keys
        if (keyMap[key]) return t(`report.sections.${keyMap[key]}`);
        if (key === 'demographics') return t('report.sections.demographics');
        if (key === 'psychographics') return t('report.sections.psychographics');
        if (key === 'painPoints') return t('report.sections.painPoints');
        if (key === 'needs') return t('report.sections.painPoints');
        if (key === 'primaryChannels') return t('report.sections.primaryChannels');
        if (key === 'contentIdeas') return t('report.sections.contentIdeas');
        if (key === 'promotionalTactics') return t('report.sections.promotionalTactics');
        if (key === 'commonPraises') return t('report.sections.commonPraises');
        if (key === 'recurringComplaints') return t('report.sections.recurringComplaints');
        if (key === 'unmetNeeds') return t('report.sections.unmetNeeds');

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

                {/* AI Analysis (Intro) */}
                {mainContent && (
                    <View style={styles.section}>
                        <View style={styles.aiAnalysisCard}>
                            <Text style={styles.aiAnalysisTitle}>{t("report.sections.aiAnalysis")}</Text>
                            <MainContentRenderer html={mainContent} style={styles.aiAnalysisText} />
                        </View>
                    </View>
                )}

                {/* SWOT Analysis */}
                {(swotData.strengths.length > 0 || swotData.weaknesses.length > 0) && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>{t("report.sections.swotAnalysis")}</Text>
                        <View style={styles.swotContainer}>
                            {swotData.strengths.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#F0FDF4' }]}>
                                    <Text style={[styles.swotTitle, { color: '#166534' }]}>{t("report.sections.strengths")}</Text>
                                    {swotData.strengths.map((item: string, i: number) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#166534' }]} />
                                            <RenderHtmlText text={item} style={styles.text} />
                                        </View>
                                    ))}
                                </View>
                            )}
                            {swotData.weaknesses.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#FEF2F2' }]}>
                                    <Text style={[styles.swotTitle, { color: '#991B1B' }]}>{t("report.sections.weaknesses")}</Text>
                                    {swotData.weaknesses.map((item: string, i: number) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#991B1B' }]} />
                                            <RenderHtmlText text={item} style={styles.text} />
                                        </View>
                                    ))}
                                </View>
                            )}
                            {swotData.opportunities.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#EFF6FF' }]}>
                                    <Text style={[styles.swotTitle, { color: '#1E40AF' }]}>{t("report.sections.opportunities")}</Text>
                                    {swotData.opportunities.map((item: string, i: number) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#1E40AF' }]} />
                                            <RenderHtmlText text={item} style={styles.text} />
                                        </View>
                                    ))}
                                </View>
                            )}
                            {swotData.threats.length > 0 && (
                                <View style={[styles.swotBox, { backgroundColor: '#FFF7ED' }]}>
                                    <Text style={[styles.swotTitle, { color: '#9A3412' }]}>{t("report.sections.threats")}</Text>
                                    {swotData.threats.map((item: string, i: number) => (
                                        <View key={i} style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#9A3412' }]} />
                                            <RenderHtmlText text={item} style={styles.text} />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Market Trends */}
                {trendsData.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.marketTrends")}</Text>
                        <View style={styles.gridContainer}>
                            {trendsData.map((item: string, i: number) => (
                                <View key={i} style={[styles.gridItem, styles.card]}>
                                    <View style={styles.cardContent}>
                                        <View style={styles.bulletPoint}>
                                            <View style={[styles.bullet, { backgroundColor: '#4B5563' }]} />
                                            <RenderHtmlText text={item} style={styles.text} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Target Audience */}
                {targetAudienceMatch && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.targetAudience")}</Text>
                        <View style={styles.gridContainer}>
                            {Object.entries(targetAudienceData).map(([key, items]: [string, any]) => (
                                <View key={key} style={[styles.gridItem, styles.card]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{getTranslatedKey(key)}</Text>
                                    </View>
                                    <View style={styles.cardContent}>
                                        {items.map((item: string, i: number) => (
                                            <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                                <Text style={styles.text}>• </Text>
                                                <RenderHtmlText text={item} style={styles.text} />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Marketing Strategy */}
                {marketingMatch && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.marketingStrategy")}</Text>
                        <View style={styles.gridContainer}>
                            {Object.entries(marketingData).map(([key, items]: [string, any]) => (
                                <View key={key} style={[styles.gridItem, styles.card]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{getTranslatedKey(key)}</Text>
                                    </View>
                                    <View style={styles.cardContent}>
                                        {items.map((item: string, i: number) => (
                                            <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                                <Text style={styles.text}>• </Text>
                                                <RenderHtmlText text={item} style={styles.text} />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Customer Sentiment */}
                {customerSentimentMatch && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t("report.sections.customerSentiment")}</Text>
                        <View style={styles.gridContainer}>
                            {Object.entries(customerSentimentData).map(([key, items]: [string, any]) => (
                                <View key={key} style={[styles.gridItem, styles.card]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{getTranslatedKey(key)}</Text>
                                    </View>
                                    <View style={styles.cardContent}>
                                        {items.map((item: string, i: number) => (
                                            <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                                <Text style={styles.text}>• </Text>
                                                <RenderHtmlText text={item} style={styles.text} />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Competitors List & Map */}
                <View style={styles.section} break>
                    <Text style={styles.sectionTitle}>{t("report.sections.nearbyCompetitors")}</Text>

                    {/* Map Section */}


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
                    Generated by Competitor Watcher • {new Date().getFullYear()} • All Rights Reserved
                </Text>
            </Page>
        </Document>
    );
};

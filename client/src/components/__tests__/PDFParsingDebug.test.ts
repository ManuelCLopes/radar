import { describe, it, expect } from 'vitest';

describe('PDF Parsing Logic', () => {
    const aiAnalysisHTML = `
<h2 class="text-lg font-semibold mt-4 mb-2">Visão Geral do Mercado</h2>
<p class="my-2">O mercado de restaurantes em Viseu apresenta-se bastante competitivo...</p>

<h2 class="text-lg font-semibold mt-4 mb-2">Análise SWOT</h2>
<h3 class="text-base font-semibold mt-3 mb-2">Pontos Fortes</h3>
<ul class="list-disc list-inside space-y-1 my-2">
  <li><strong class="font-semibold">Localização Privilegiada:</strong> Situado numa zona central.</li>
  <li><strong>Ambiente Acolhedor:</strong> Decoração moderna.</li>
</ul>

<h3 class="text-base font-semibold mt-3 mb-2">Pontos Fracos</h3>
<ul class="list-disc list-inside space-y-1 my-2">
  <li>Preço elevado.</li>
</ul>

<h2 class="text-lg font-semibold mt-4 mb-2">TENDÊNCIAS DE MERCADO</h2>
<ul class="list-disc list-inside space-y-1 my-2">
  <li>Sustentabilidade.</li>
  <li>Take-away.</li>
</ul>

<h2 class="text-lg font-semibold mt-4 mb-2">PERSONA DO PÚBLICO-ALVO</h2>
<h3 class="text-base font-semibold mt-3 mb-2">Demografia</h3>
<p class="my-2">Jovens adultos, 25-35 anos.</p>

<h2 class="text-lg font-semibold mt-4 mb-2">ESTRATÉGIA DE MARKETING</h2>
<h3 class="text-base font-semibold mt-3 mb-2">Canais Principais</h3>
<ul class="list-disc list-inside space-y-1 my-2">
  <li>Instagram.</li>
</ul>
  `;

    const extractListItems = (text: string, sectionTitle: string) => {
        const sectionRegex = new RegExp(`<h[23][^>]*>(${sectionTitle})</h[23]>[\\s\\S]*?<ul[^>]*>([\\s\\S]*?)</ul>`, 'i');
        const match = text.match(sectionRegex);
        if (!match) return [];
        const listContent = match[2];
        const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        return items.map(item => item.replace(/<[^>]*>/g, '').trim());
    };

    const extractComplexSection = (text: string, mainSectionTitle: string, subSections: string[]) => {
        const result: Record<string, string[]> = {};
        const mainSectionRegex = new RegExp(`<h[23][^>]*>(${mainSectionTitle})</h[23]>([\\s\\S]*?)(?=<h2|$)`, 'i');
        const mainMatch = text.match(mainSectionRegex);

        if (!mainMatch) return result;
        const content = mainMatch[2];

        subSections.forEach(sub => {
            const subRegex = new RegExp(`<h[34][^>]*>(${sub})</h[34]>([\\s\\S]*?)(?=<h[34]|$)`, 'i');
            const subMatch = content.match(subRegex);
            if (subMatch) {
                const subContent = subMatch[2];
                if (subContent.includes('<ul')) {
                    const items = subContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
                    result[sub] = items.map(item => item.replace(/<[^>]*>/g, '').trim());
                } else {
                    result[sub] = [subContent.replace(/<[^>]*>/g, '').trim()];
                }
            }
        });
        return result;
    };

    it('extracts Strengths correctly', () => {
        const strengths = extractListItems(aiAnalysisHTML, 'Strengths|Pontos Fortes');
        console.log('Strengths:', strengths);
        expect(strengths.length).toBe(2);
    });

    it('extracts Market Trends correctly', () => {
        const trends = extractListItems(aiAnalysisHTML, 'MARKET TRENDS|TENDÊNCIAS DE MERCADO');
        console.log('Trends:', trends);
        expect(trends.length).toBe(2);
    });

    it('extracts Target Audience correctly', () => {
        const audience = extractComplexSection(aiAnalysisHTML, 'TARGET AUDIENCE PERSONA|PERSONA DO PÚBLICO-ALVO', [
            'Demographics|Demografia'
        ]);
        console.log('Audience:', audience);
        expect(audience['Demographics|Demografia']).toBeDefined();
    });
});

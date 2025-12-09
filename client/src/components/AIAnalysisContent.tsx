import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

// Import glossaries
import ptGlossary from '@/i18n/glossary/pt.json';
import enGlossary from '@/i18n/glossary/en.json';
import esGlossary from '@/i18n/glossary/es.json';
import frGlossary from '@/i18n/glossary/fr.json';
import deGlossary from '@/i18n/glossary/de.json';

interface AIAnalysisContentProps {
    html: string;
}

const glossaries: Record<string, typeof ptGlossary> = {
    pt: ptGlossary,
    en: enGlossary,
    es: esGlossary,
    fr: frGlossary,
    de: deGlossary,
};

export function AIAnalysisContent({ html }: AIAnalysisContentProps) {
    const { i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Normalize language code (pt-PT -> pt, en-US -> en, etc.)
        const rawLang = i18n?.language || 'en';
        const currentLang = rawLang.split('-')[0]; // Get base language code
        const glossary = glossaries[currentLang] || enGlossary;
        const terms = Object.keys(glossary);

        // Process text nodes and add tooltips for technical terms
        const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                let modifiedHTML = text;

                terms.forEach(term => {
                    // Only match standalone terms (not in middle of words/phrases)
                    const regex = new RegExp(`\\b${term}\\b(?!\\s+[A-Z])`, 'gi');
                    if (regex.test(text)) {
                        const termData = glossary[term as keyof typeof glossary];
                        modifiedHTML = modifiedHTML.replace(
                            regex,
                            `<span class="inline-flex items-center gap-1 relative group cursor-help">
                <span class="font-semibold text-primary">${term}</span>
                <sup class="inline-flex items-center">
                  <svg class="h-3 w-3 text-primary/60 hover:text-primary transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </sup>
                <span class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-[9999] w-80 p-4 text-sm text-foreground bg-popover border-2 border-primary/30 rounded-lg shadow-2xl">
                  <span class="absolute left-4 -bottom-2 w-4 h-4 bg-popover border-r-2 border-b-2 border-primary/30 transform rotate-45"></span>
                  <div class="relative z-10 bg-popover">
                    <span class="font-bold block mb-2 text-primary text-base">${termData.full}</span>
                    <span class="text-muted-foreground text-sm leading-relaxed block">${termData.definition}</span>
                  </div>
                </span>
              </span>`
                        );
                    }
                });

                if (modifiedHTML !== text) {
                    const span = document.createElement('span');
                    span.innerHTML = modifiedHTML;
                    node.parentNode?.replaceChild(span, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Don't process if already processed or is a code/pre tag
                if ((node as Element).classList?.contains('glossary-processed') ||
                    ['CODE', 'PRE', 'SCRIPT', 'STYLE'].includes(node.nodeName)) {
                    return;
                }

                Array.from(node.childNodes).forEach(processNode);
            }
        };

        // Reset and process
        const container = containerRef.current;
        container.querySelectorAll('.glossary-processed').forEach(el => {
            el.classList.remove('glossary-processed');
        });


        processNode(container);
        container.classList.add('glossary-processed');

    }, [html]); // Only depend on html, not i18n.language
    return (
        <div
            ref={containerRef}
            className="prose prose-base dark:prose-invert max-w-none p-6 
                 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-6 [&>h2]:first:mt-0
                 [&>h2]:text-primary [&>h2]:flex [&>h2]:items-center [&>h2]:gap-2
                 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-4 
                 [&>h3]:text-foreground/90 [&>h3]:border-l-4 [&>h3]:border-primary/30 [&>h3]:pl-3
                 [&>h4]:text-base [&>h4]:font-medium [&>h4]:mb-2 [&>h4]:text-foreground/80
                 [&>p]:text-foreground/80 [&>p]:leading-relaxed [&>p]:my-3
                 [&>ul]:my-3 [&>ul]:space-y-2
                 [&>ul>li]:text-foreground/80 [&>ul>li]:pl-2
                 [&>ul>li::marker]:text-primary
                 [&>ol]:my-3 [&>ol]:space-y-2
                 [&>ol>li]:text-foreground/80 [&>ol>li]:pl-2
                 [&>strong]:text-primary [&>strong]:font-semibold
                 [&>em]:text-foreground/70 [&>em]:italic
                 [&>hr]:my-6 [&>hr]:border-muted"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

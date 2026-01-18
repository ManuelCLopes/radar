
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIAnalysisContent } from '../components/AIAnalysisContent';
import React from 'react';

// Mock i18next
import { useTranslation } from 'react-i18next';
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (str: string) => str,
        i18n: {
            language: 'en',
            changeLanguage: () => new Promise(() => { }),
        },
    }),
}));

describe('AIAnalysisContent Security', () => {
    it('should sanitize dangerous HTML content', () => {
        const dirtyHtml = `
            <div>
                <h2>Safe Title</h2>
                <img src="x" onerror="alert('XSS')" data-testid="malicious-img" />
                <script>alert('Script XSS')</script>
                <div onclick="alert('Click XSS')">Click me</div>
            </div>
        `;

        const { container } = render(<AIAnalysisContent html={dirtyHtml} />);

        // Check that safe content is rendered
        expect(screen.getByText('Safe Title')).toBeInTheDocument();

        // Check that malicious attributes are removed
        // const img = screen.getByTestId('malicious-img'); 
        // We will check html content directly as attributes might be stripped
        // This might fail if the whole img is removed or attr is removed.
        // Actually DOMPurify usually keeps the tag but removes the onerror.
        // But if the img tag itself is unsafe it might be removed? No, img is usually safe.
        // However, standard testing-library queries might not easily check for attributes directly on an element found by another way easily if we don't know if it exists.

        // Let's inspect the innerHTML
        const htmlContent = container.innerHTML;

        expect(htmlContent).not.toContain('onerror');
        expect(htmlContent).not.toContain('alert(\'XSS\')');
        expect(htmlContent).not.toContain('<script>');
        expect(htmlContent).not.toContain('onclick');
    });

    it('should render safe HTML correctly', () => {
        const safeHtml = '<h2>Hello World</h2><p>This is safe.</p>';
        const { container } = render(<AIAnalysisContent html={safeHtml} />);

        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByText('This is safe.')).toBeInTheDocument();
    });
});

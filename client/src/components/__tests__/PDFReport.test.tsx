import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PDFReport } from '../PDFReport';
import { Report } from '@shared/schema';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
    Document: ({ children }: any) => <div>{children}</div>,
    Page: ({ children }: any) => <div>{children}</div>,
    Text: ({ children }: any) => <div>{children}</div>,
    View: ({ children }: any) => <div>{children}</div>,
    StyleSheet: { create: (styles: any) => styles },
    Font: { register: vi.fn() },
}));

describe('PDFReport', () => {
    const mockReport: Report = {
        id: '1',
        businessId: '1',
        businessName: 'Test Business',
        competitors: [
            {

                name: 'Comp 1',
                address: '123 St',
                rating: 4.5,
                userRatingsTotal: 100,
                types: ['restaurant'],
                priceLevel: '$$',
                distance: '0.5 km',
                reviews: []
            }
        ],
        aiAnalysis: `
<h3>MARKET OVERVIEW</h3>
This is the market overview.

<h3>Strengths</h3>
<ul>
<li>Good food</li>
</ul>
<h3>Weaknesses</h3>
<ul>
<li>High prices</li>
</ul>
<h3>Opportunities</h3>
<ul>
<li>Expansion</li>
</ul>
<h3>Threats</h3>
<ul>
<li>Competition</li>
</ul>
    `,
        generatedAt: new Date(),
        html: '',
        userId: 'user1',
        radius: null,
        shareToken: null,
        isShared: false,
        executiveSummary: "Summary",
        swotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        marketTrends: [],
        targetAudience: {},
        marketingStrategy: {},
        customerSentiment: {},
        businessRating: null,
        businessUserRatingsTotal: null
    };

    const mockT = (key: string) => key;

    it('renders without crashing and parses sections', () => {
        const { getByText } = render(<PDFReport report={mockReport} t={mockT} />);
        expect(getByText(/Test Business/)).toBeTruthy();
        expect(getByText(/Comp 1/)).toBeTruthy();

        // Check if sections are rendered
        expect(getByText('Good food')).toBeTruthy();
        expect(getByText('High prices')).toBeTruthy();
        expect(getByText('This is the market overview.')).toBeTruthy();
    });
});

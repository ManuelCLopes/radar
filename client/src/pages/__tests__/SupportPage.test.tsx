import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SupportPage from '../SupportPage';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Mock wouter
vi.mock('wouter', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('SupportPage', () => {
    const renderSupportPage = () => {
        return render(
            <I18nextProvider i18n={i18n}>
                <SupportPage />
            </I18nextProvider>
        );
    };

    describe('Page Structure', () => {
        it('should render the support page', () => {
            renderSupportPage();
            expect(screen.getByText(/Support Radar/i)).toBeInTheDocument();
        });

        it('should render the back to dashboard button', () => {
            renderSupportPage();
            expect(screen.getByText(/Back to Dashboard/i)).toBeInTheDocument();
        });

        it('should render the hero section', () => {
            renderSupportPage();
            expect(screen.getByText(/Help keep Radar 100% free and open source/i)).toBeInTheDocument();
        });
    });

    describe('Why Support Section', () => {
        it('should render the why support section', () => {
            renderSupportPage();
            expect(screen.getByText(/Why Your Support Matters/i)).toBeInTheDocument();
        });

        it('should display cost categories', () => {
            renderSupportPage();
            expect(screen.getByText(/Location Data & Maps/i)).toBeInTheDocument();
            expect(screen.getByText(/Hosting & Infrastructure/i)).toBeInTheDocument();
            expect(screen.getByText(/AI-Powered Insights/i)).toBeInTheDocument();
        });

        it('should display the mission statement', () => {
            renderSupportPage();
            expect(screen.getAllByText(/Keep Radar 100% Free/i)[0]).toBeInTheDocument();
        });
    });

    describe('Donation Platforms', () => {
        it('should render donation section title', () => {
            renderSupportPage();
            expect(screen.getByText(/Choose How to Support/i)).toBeInTheDocument();
        });

        it('should render GitHub Sponsors option', () => {
            renderSupportPage();
            expect(screen.getByText('GitHub Sponsors')).toBeInTheDocument();
            expect(screen.getByText(/Monthly recurring support/i)).toBeInTheDocument();
        });

        it('should render Ko-fi option', () => {
            renderSupportPage();
            expect(screen.getByText('Ko-fi')).toBeInTheDocument();
            expect(screen.getByText(/One-time coffee/i)).toBeInTheDocument();
        });

        it('should render Buy Me a Coffee option', () => {
            renderSupportPage();
            expect(screen.getByText('Buy Me a Coffee')).toBeInTheDocument();
            expect(screen.getByText(/One-time support/i)).toBeInTheDocument();
        });

        it('should have external links for donation platforms', () => {
            renderSupportPage();
            const links = screen.getAllByRole('link');
            const donationLinks = links.filter(link =>
                link.getAttribute('href')?.includes('github.com/sponsors') ||
                link.getAttribute('href')?.includes('ko-fi.com') ||
                link.getAttribute('href')?.includes('buymeacoffee.com')
            );
            expect(donationLinks.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Other Ways to Help Section', () => {
        it('should render other ways section', () => {
            renderSupportPage();
            expect(screen.getByText(/Can't Donate\? No Problem!/i)).toBeInTheDocument();
        });

        it('should display all help options', () => {
            renderSupportPage();
            expect(screen.getByText(/Star on GitHub/i)).toBeInTheDocument();
            expect(screen.getByText(/Report Bugs/i)).toBeInTheDocument();
            expect(screen.getByText(/Suggest Features/i)).toBeInTheDocument();
            expect(screen.getByText(/Share with Friends/i)).toBeInTheDocument();
        });
    });

    describe('Thank You Section', () => {
        it('should render thank you message', () => {
            renderSupportPage();
            expect(screen.getByText(/Thank You!/i)).toBeInTheDocument();
            expect(screen.getByText(/Your support makes it possible to keep Radar free/i)).toBeInTheDocument();
        });
    });

    describe('i18n Support', () => {
        it('should render in English by default', async () => {
            await i18n.changeLanguage('en');
            renderSupportPage();
            expect(screen.getByText('Support Radar')).toBeInTheDocument();
        });

        it('should switch to Portuguese', async () => {
            await i18n.changeLanguage('pt');
            renderSupportPage();
            expect(screen.getByText('Apoiar o Radar')).toBeInTheDocument();
        });

        it('should switch to Spanish', async () => {
            await i18n.changeLanguage('es');
            renderSupportPage();
            expect(screen.getByText('Apoyar Radar')).toBeInTheDocument();
        });

        it('should switch to French', async () => {
            await i18n.changeLanguage('fr');
            renderSupportPage();
            expect(screen.getByText('Soutenir Radar')).toBeInTheDocument();
        });

        it('should switch to German', async () => {
            await i18n.changeLanguage('de');
            renderSupportPage();
            expect(screen.getByText('Radar Unterstützen')).toBeInTheDocument();
        });
    });
});

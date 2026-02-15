import { test, expect } from '@playwright/test';

test.describe('Report Interactions', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com', isVerified: true } } });
        });

        // Mock business
        await page.route('**/api/businesses', async route => {
            await route.fulfill({
                status: 200,
                json: [{ id: 'bus-1', name: 'Test Business', type: 'restaurant', address: '123 Test St', latitude: 38.7, longitude: -9.1, locationStatus: 'validated' }]
            });
        });

        // Mock specific business details
        await page.route('**/api/businesses/bus-1', async route => {
            await route.fulfill({
                status: 200,
                json: { id: 'bus-1', name: 'Test Business', type: 'restaurant', address: '123 Test St', latitude: 38.7, longitude: -9.1, locationStatus: 'validated' }
            });
        });

        // Mock report history for the business
        await page.route('**/api/reports/business/*', async route => {
            await route.fulfill({
                status: 200,
                json: [{
                    id: 'rep-1',
                    businessId: 'bus-1',
                    userId: 1,
                    businessName: 'Test Business',
                    aiAnalysis: '## Analysis\n\n- Good\n- Bad',
                    generatedAt: new Date().toISOString(),
                    competitors: [],
                    html: null,
                    executiveSummary: "E2E Executive Summary",
                    swotAnalysis: {
                        strengths: ['E2E Strength'],
                        weaknesses: [],
                        opportunities: [],
                        threats: []
                    },
                    marketTrends: ['E2E Trend'],
                    targetAudience: { demographics: { ageRange: "E2E Demographics", gender: "All", incomeLevel: "Medium" }, psychographics: "", painPoints: ["E2E Pain Point"] },
                    marketingStrategy: { channels: ["E2E Channel"], tactics: ["E2E Tactic"] },
                    customerSentiment: { commonPraises: [], recurringComplaints: [], unmetNeeds: [] }
                }]
            });
        });

        await page.goto('/dashboard?e2e=true');
        await expect(page).toHaveURL(/dashboard/);
    });

    test('Opening report and checking export options', async ({ page }) => {
        // Force EN for consistent button names if needed
        await page.getByTestId('button-language-selector').click();
        await page.getByTestId('button-lang-en').click();

        // Click view history button on the business card
        await page.getByTestId('button-view-history-bus-1').click();

        // Wait for history dialog title
        await expect(page.getByRole('heading', { name: /Report History|Histórico de Relatórios/i }).first()).toBeVisible();

        // Click view report button in history dialog
        await page.getByTestId('button-view-report-rep-1').click();

        // Check report title
        await expect(page.getByTestId('report-title')).toBeVisible();

        // Check structured data visibility
        await expect(page.getByText('E2E Executive Summary')).toBeVisible();
        await expect(page.getByText('E2E Strength')).toBeVisible();
        await expect(page.getByText('E2E Trend')).toBeVisible();
        await expect(page.getByText('E2E Demographics')).toBeVisible();

        // Open export dropdown
        await page.getByTestId('button-export-report').click();

        // Wait for dropdown to open
        await expect(page.locator('[role="menu"]')).toBeVisible();

        // Check presence of items
        await expect(page.getByTestId('button-download-html')).toBeVisible();
        await expect(page.getByTestId('button-download-pdf')).toBeVisible();
        await expect(page.getByTestId('button-email-report')).toBeVisible();
    });

    test('Email share dialog functions correctly', async ({ page }) => {
        // Ensure we are on the page with e2e param (handled by beforeEach, but let's be safe if reloading)
        if (page.url().indexOf('?e2e=true') === -1) {
            await page.goto('/dashboard?e2e=true');
        }
        await page.getByTestId('button-view-history-bus-1').click();
        await page.getByTestId('button-view-report-rep-1').click();

        // Open export and click email
        await page.getByTestId('button-export-report').click();
        await page.getByTestId('button-email-report').click();

        // Wait for email dialog to be attached
        await expect(page.getByRole('dialog', { name: /Email Report|Enviar Relatório|report\.actions\.email/i })).toBeVisible();

        // Verify email dialog
        await expect(page.getByRole('heading', { name: /Email Report|Enviar Relatório|report\.actions\.email/i }).first()).toBeVisible();

        // Fill email and mock success
        await page.route('**/api/reports/rep-1/email', async route => {
            await route.fulfill({ status: 200, json: { message: 'Success' } });
        });

        await page.locator('#email').fill('friend@example.com');
        await page.getByRole('button', { name: /Send|Enviar/i }).click();

        // Verify success toast
        await expect(page.getByText(/Email sent|E-mail enviado/i).first()).toBeVisible();
    });
});

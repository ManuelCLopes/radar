import { test, expect } from '@playwright/test';

test.describe('Report Interactions', () => {

    test.beforeEach(async ({ page }) => {
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com' } } });
        });

        // Mock business
        await page.route('**/api/businesses', async route => {
            await route.fulfill({
                status: 200,
                json: [{ id: 'bus-1', name: 'Test Business', type: 'restaurant', address: '123 Test St', latitude: 38.7, longitude: -9.1, locationStatus: 'validated' }]
            });
        });

        // Mock report history for the business
        await page.route('**/api/reports/business/*', async route => {
            await route.fulfill({
                status: 200,
                json: [{
                    id: 'rep-1',
                    businessId: 'bus-1',
                    businessName: 'Test Business',
                    aiAnalysis: '## Analysis\n\n- Good\n- Bad',
                    generatedAt: new Date().toISOString(),
                    competitors: [],
                    html: '<div>Analysis</div>'
                }]
            });
        });

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Opening report and checking export options', async ({ page }) => {
        // Force EN for consistent button names if needed
        await page.getByTestId('button-language-selector').click();
        await page.getByTestId('button-lang-en').click();

        // Click view history button on the business card
        await page.getByTestId('button-view-history-bus-1').click();

        // Click view report button in history dialog
        await page.getByTestId('button-view-report-rep-1').click();

        // Check report title
        await expect(page.getByTestId('report-title')).toBeVisible();

        // Open export dropdown
        await page.getByTestId('button-export-report').click();

        // Check presence of items
        await expect(page.getByTestId('button-download-html')).toBeVisible();
        await expect(page.getByTestId('button-download-pdf')).toBeVisible();
        await expect(page.getByTestId('button-email-report')).toBeVisible();
    });

    test('Email share dialog functions correctly', async ({ page }) => {
        await page.getByTestId('button-view-history-bus-1').click();
        await page.getByTestId('button-view-report-rep-1').click();

        // Open export and click email
        await page.getByTestId('button-export-report').click();
        await page.getByTestId('button-email-report').click();

        // Verify email dialog
        await expect(page.getByRole('heading', { name: /Email Report|Enviar Relatório/i }).first()).toBeVisible();

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

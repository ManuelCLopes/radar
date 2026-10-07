import { test, expect } from '@playwright/test';

test.describe('Public marketing pages', () => {
    test('English landing pages render with canonical and hreflang links', async ({ page }) => {
        await page.goto('/local-competitor-analysis');
        await expect(page.getByTestId('marketing-heading')).toHaveText(/Local Competitor Analysis/);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://competitorwatcher.pt/local-competitor-analysis');
        await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', 'https://competitorwatcher.pt/pt/local-competitor-analysis');
    });

    test('Portuguese pages render in Portuguese under /pt', async ({ page }) => {
        await page.goto('/pt/competitor-tracker');
        await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
        await expect(page.getByTestId('marketing-heading')).toHaveText(/Monitorização de Concorrentes/);
    });

    test('sample report is reachable from the homepage', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('link-sample-report').click();
        await expect(page).toHaveURL(/\/competitor-analysis-report$/);
        await expect(page.getByTestId('sample-disclaimer')).toBeVisible();
    });
});

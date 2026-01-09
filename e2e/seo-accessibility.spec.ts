import { test, expect } from '@playwright/test';

test.describe('SEO & Accessibility', () => {

    test('Landing page has correct meta tags', async ({ page }) => {
        await page.goto('/');

        // Title check (Helmet might delay this slightly)
        await expect(page).toHaveTitle(/Competitive Watcher|Competitor Watcher/i);

        // Meta description
        const description = page.locator('meta[name="description"]').first();
        await expect(description).toHaveAttribute('content', /Analyze|concorrência/i, { timeout: 10000 });

        // OpenGraph tags
        const ogTitle = page.locator('meta[property="og:title"]').first();
        await expect(ogTitle).toHaveAttribute('content', /Watcher|Analyzer/i);
    });

    test('Logos have descriptive alt text', async ({ page }) => {
        await page.goto('/');

        const logo = page.locator('header img');
        await expect(logo).toHaveAttribute('alt', /Competitor Watcher/i);
    });

    test('Icon buttons have accessible labels (sr-only)', async ({ page }) => {
        await page.goto('/');

        // Language selector
        const langBtn = page.getByTestId('button-language-selector');
        await expect(langBtn.locator('.sr-only')).not.toBeEmpty();

        // Theme toggle
        const themeBtn = page.getByTestId('button-theme-toggle');
        await expect(themeBtn.locator('.sr-only')).not.toBeEmpty();
    });
});

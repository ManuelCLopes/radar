import { test, expect } from '@playwright/test';

test.describe('Support Page Details', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/support');
    });

    test('Support page renders mission and costs correctly', async ({ page }) => {
        // Check Mission
        await expect(page.getByText(/Nossa Missão|Our Mission/i)).toBeVisible();

        // Check Cost items
        await expect(page.getByText(/Google Places API|Maps/i).first()).toBeVisible();
        await expect(page.getByText(/Hosting|Infraestrutura/i).first()).toBeVisible();
        await expect(page.getByText(/OpenAI API|Insights AI/i).first()).toBeVisible();
    });

    test('Share with friends button copies to clipboard and shows toast', async ({ page }) => {
        // Grant clipboard permissions
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

        // Click Share
        const shareBtn = page.getByText(/Share with Friends|Partilhar com Amigos/i);
        await shareBtn.click();

        // Verify toast
        await expect(page.getByText(/Link copiado|Link copied/i).first()).toBeVisible();

        // Verify clipboard content (should be the origin)
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain(new URL(page.url()).origin);
    });

    test('External donation links have correct attributes', async ({ page }) => {
        const githubLink = page.getByRole('link', { name: /GitHub Sponsors|Patrocinar/i });
        await expect(githubLink).toHaveAttribute('href', /github\.com/);
        await expect(githubLink).toHaveAttribute('target', '_blank');

        const kofiLink = page.getByRole('link', { name: /Ko-fi|Comprar um Café/i });
        await expect(kofiLink).toHaveAttribute('href', /ko-fi\.com/);
        await expect(kofiLink).toHaveAttribute('target', '_blank');
    });
});

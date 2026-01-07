import { test, expect } from '@playwright/test';

test.describe('UI Persistence', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure we are guests
        await page.route('/api/auth/user', async route => {
            await route.fulfill({ status: 401, json: { message: 'Not authenticated' } });
        });
        await page.goto('/');
    });

    test('Language preference persists after page reload', async ({ page }) => {
        // Switch to Portuguese
        await page.getByTestId('button-language-selector').click();
        await page.getByTestId('button-lang-pt').click();

        // Verify some Portuguese text
        await expect(page.getByText(/Como funciona/i)).toBeVisible();

        // Reload the page
        await page.reload();

        // Verify Portuguese text is still there
        await expect(page.getByText(/Como funciona/i)).toBeVisible();
        await expect(page.getByText(/How it works/i)).not.toBeVisible();
    });

    test('Theme preference persists after page reload', async ({ page }) => {
        // Toggle theme (assuming light is default)
        const themeBtn = page.getByTestId('button-theme-toggle');
        await themeBtn.click();

        // Check if html has 'dark' class
        await expect(page.locator('html')).toHaveClass(/dark/);

        // Reload the page
        await page.reload();

        // Verify theme is still dark
        await expect(page.locator('html')).toHaveClass(/dark/);
    });
});

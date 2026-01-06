import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
    test('should show 404 page for non-existent routes', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        // Verify 404 content
        await expect(page.getByText(/404 Page Not Found/i)).toBeVisible();
        await expect(page.getByText(/Did you forget to add the page to the router/i)).toBeVisible();
    });
});

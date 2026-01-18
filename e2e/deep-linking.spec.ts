import { test, expect } from '@playwright/test';

test.describe('Deep Linking', () => {

    test.beforeEach(async ({ page }) => {
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com', isVerified: true } } });
        });

        // Mock business
        await page.route('**/api/businesses', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // Mock report history
        await page.route('**/api/reports/history*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });
    });

    test('Direct navigation to history tab works', async ({ page }) => {
        await page.goto('/dashboard?tab=history');
        await expect(page).toHaveURL(/tab=history/);

        // History title should be visible
        await expect(page.getByText(/Analysis History|Histórico de Análises/i)).toBeVisible();

        // "Businesses" tab content should NOT be visible (or at least history should be active)
        const historyTab = page.getByRole('tab', { name: /History|Histórico/i });
        await expect(historyTab).toHaveAttribute('aria-selected', 'true');
    });

    test('Switching tabs updates URL', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);

        await page.getByRole('tab', { name: /History|Histórico/i }).click();
        await expect(page).toHaveURL(/tab=history/);

        await page.getByRole('tab', { name: /Businesses|Empresas/i }).click();
        await expect(page).toHaveURL(/tab=businesses/);
    });

    test('Deep links to legal sections work', async ({ page }) => {
        await page.goto('/privacy-policy');
        await expect(page.getByRole('heading', { name: /Privacy Policy|Política de Privacidade/i })).toBeVisible();
    });
});

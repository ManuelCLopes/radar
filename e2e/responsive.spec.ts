import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
    test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 Pro size

    test('Landing page hero is readable and search works on mobile', async ({ page }) => {
        await page.goto('/');

        // Verify headline is visible
        await expect(page.getByTestId('hero-headline')).toBeVisible();

        // Check if search form is stacked or usable
        const searchInput = page.getByPlaceholder(/Rua de Belém/i);
        await expect(searchInput).toBeVisible();
        await searchInput.fill('Test Address');

        // Ensure buttons don't overlap (basic check)
        const analyzeBtn = page.getByRole('button', { name: /Analyze|Analisar/i });
        await expect(analyzeBtn).toBeVisible();
    });

    test('Dashboard tabs and logout are accessible on mobile', async ({ page }) => {
        // Mock auth BEFORE any navigation/mock setup
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com' } } });
        });
        await page.route('**/api/businesses*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });
        await page.route('**/api/reports/history*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        await page.goto('/dashboard');

        // Ensure we are on dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify tabs are visible (might be truncated/scrollable)
        const businessesTab = page.getByRole('tab', { name: /Businesses|Negócios/i });
        await expect(businessesTab).toBeVisible();

        // Check logout button in header
        const logoutBtn = page.getByRole('button', { name: /Log out|Sair/i }).first();
        await expect(logoutBtn).toBeVisible();
    });
});

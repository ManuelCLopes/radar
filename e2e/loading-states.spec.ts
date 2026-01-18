import { test, expect } from '@playwright/test';

test.describe('Loading States', () => {

    test('Dashboard shows skeletons while loading businesses', async ({ page }) => {
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com', isVerified: true } } });
        });

        // Mock slow businesses response
        await page.route('**/api/businesses', async route => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await route.fulfill({ status: 200, json: [] });
        });

        await page.goto('/dashboard');

        // Verify skeletons (divs with animate-pulse) are visible
        const skeletons = page.locator('.animate-pulse');
        await expect(skeletons.first()).toBeVisible({ timeout: 5000 });

        // Wait for loading to finish
        await expect(skeletons.first()).not.toBeVisible({ timeout: 15000 });

        // Verify empty state message appears after loading
        await expect(page.getByTestId('empty-state-message')).toBeVisible();
    });

    test('Report generation shows processing state', async ({ page }) => {
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com', isVerified: true } } });
        });

        // Mock business
        await page.route('**/api/businesses', async route => {
            await route.fulfill({
                status: 200,
                json: [{ id: 'bus-1', name: 'Test Business', type: 'restaurant', address: '123 Test St', latitude: 38.7, longitude: -9.1, locationStatus: 'validated', createdAt: new Date().toISOString() }]
            });
        });

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);

        // Mock slow report generation
        await page.route('**/api/run-report/*', async route => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await route.fulfill({
                status: 200,
                json: {
                    id: 'rep-new',
                    businessId: 'bus-1',
                    businessName: 'Test Business',
                    aiAnalysis: 'Analysis complete',
                    generatedAt: new Date().toISOString(),
                    competitors: [],
                    html: '<div>Complete</div>'
                }
            });
        });

        // Click generate report
        const genBtn = page.getByTestId('button-generate-report-bus-1');
        await genBtn.click();

        // Verify button shows loading state (Loader2 and disabled)
        await expect(genBtn).toBeDisabled();
        await expect(genBtn.locator('.animate-spin')).toBeVisible();

        // Wait for report dialog to open
        await expect(page.getByTestId('report-title')).toBeVisible({ timeout: 10000 });
    });
});

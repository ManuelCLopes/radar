import { test, expect } from '@playwright/test';

test.describe('Stripe Configuration Status', () => {
    let mockUser: any;

    test.beforeEach(async ({ page }) => {
        mockUser = {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            plan: 'free',
            subscriptionStatus: null,
            isVerified: true,
            createdAt: new Date().toISOString()
        };

        // Intercept Auth API
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({
                status: 200,
                json: { user: mockUser }
            });
        });

        // Intercept Businesses API
        await page.route('**/api/businesses*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // Intercept Reports/History API
        await page.route('**/api/reports/history*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });
    });

    test('should show Coming Soon modal when Stripe is NOT configured', async ({ page }) => {
        // Mock Stripe Config Status -> FALSE
        await page.route('**/api/stripe-config-status', async route => {
            await route.fulfill({
                status: 200,
                json: { configured: false }
            });
        });

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*dashboard/);

        // Click Subscription button (Star icon)
        await page.getByRole('button', { name: 'Subscrição' }).click();

        // Expect Coming Soon Modal
        await expect(page.getByRole('heading', { name: 'Coming Soon' })).toBeVisible();
        await expect(page.getByText('We are currently finalizing the details')).toBeVisible();
    });

    test('should show Pricing Modal when Stripe IS configured', async ({ page }) => {
        // Mock Stripe Config Status -> TRUE
        await page.route('**/api/stripe-config-status', async route => {
            await route.fulfill({
                status: 200,
                json: { configured: true }
            });
        });

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*dashboard/);

        // Click Subscription button
        await page.getByRole('button', { name: 'Subscrição' }).click();

        // Expect Pricing Modal
        await expect(page.getByText(/Free/i)).toBeVisible();
        await expect(page.getByText('Pro', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Coming Soon' })).not.toBeVisible();
    });
});

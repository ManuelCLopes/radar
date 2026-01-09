import { test, expect } from '@playwright/test';

test.describe('Internationalization Thoroughness', () => {

    test('Switching language mid-flow updates all UI elements', async ({ page }) => {
        // Mock auth - fully compliant user object
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({
                status: 200,
                json: {
                    user: {
                        id: "1",
                        email: "test@example.com",
                        firstName: "Test",
                        lastName: "User",
                        plan: "free",
                        language: "en",
                        createdAt: new Date().toISOString()
                    }
                }
            });
        });

        // Mock businesses - MUST include lat/long to avoid toFixed crash in BusinessList
        await page.route('**/api/businesses', async route => {
            await route.fulfill({
                status: 200,
                json: [{
                    id: 'bus-1',
                    name: 'Test Business',
                    type: 'restaurant',
                    address: '123 Test St',
                    latitude: 40.7128,
                    longitude: -74.0060,
                    locationStatus: 'validated',
                    createdAt: new Date().toISOString()
                }]
            });
        });

        // Mock report history
        await page.route('**/api/reports/history*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        await page.goto('/dashboard');

        // Wait for page to be ready
        await expect(page).toHaveURL(/\/dashboard/);

        // Wait for the common layout header
        await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

        // Wait for content (this ensures no skeletons are blocking)
        await expect(page.getByText('Registered Businesses')).toBeVisible({ timeout: 15000 });

        // Use the robust testid selector
        const langSelector = page.getByTestId('button-language-selector');
        await expect(langSelector).toBeVisible({ timeout: 10000 });

        // Ensure English is selected initially
        await langSelector.click({ force: true });
        await page.getByTestId('button-lang-en').click({ force: true });

        // Check English headers
        await expect(page.getByText('Registered Businesses')).toBeVisible();
        await expect(page.getByTestId('badge-type-bus-1')).toContainText(/Restaurant/i);

        // Switch to Portuguese
        // Ensure menu is closed first using structural check (menu content should not be visible)
        await expect(page.getByTestId('button-lang-pt')).not.toBeVisible();

        await langSelector.click({ force: true });
        const ptBtn = page.getByTestId('button-lang-pt');
        await expect(ptBtn).toBeVisible();
        await ptBtn.click({ force: true });

        // Check Portuguese headers
        await expect(page.getByText('Negócios Registados')).toBeVisible();
        await expect(page.getByTestId('badge-type-bus-1')).toContainText(/Restaurante/i);

        // Switch to Spanish
        // Ensure menu is closed first
        await expect(page.getByTestId('button-lang-es')).not.toBeVisible();
        await langSelector.click({ force: true });

        const esBtn = page.getByTestId('button-lang-es');
        await expect(esBtn).toBeVisible();
        await esBtn.click({ force: true });

        await expect(page.getByText('Negocios Registrados')).toBeVisible();
        await expect(page.getByTestId('badge-type-bus-1')).toContainText(/Restaurante/i);

        // Switch back to English
        await expect(page.getByTestId('button-lang-en')).not.toBeVisible();
        await langSelector.click({ force: true });

        const enBtn = page.getByTestId('button-lang-en');
        await expect(enBtn).toBeVisible();
        await enBtn.click({ force: true });
        await expect(page.getByText('Registered Businesses')).toBeVisible();
    });

    test('Landing page localized content consistency', async ({ page }) => {
        await page.goto('/');

        const langSelector = page.getByTestId('button-language-selector');
        await expect(langSelector).toBeVisible({ timeout: 15000 });

        // Force EN
        await langSelector.click();
        await page.getByTestId('button-lang-en').click();

        await expect(page.getByRole('heading', { name: /Discover Your Local Competition/i })).toBeVisible();

        // Switch to PT
        await langSelector.click();
        await page.getByTestId('button-lang-pt').click();

        await expect(page.getByRole('heading', { name: /Descubra a sua Concorrência Local/i })).toBeVisible();
    });
});

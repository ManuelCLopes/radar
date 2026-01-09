import { test, expect } from '@playwright/test';

test.describe('API Error Recovery', () => {

    test('Landing page shows error toast on quick search failure (500)', async ({ page }) => {
        await page.route('**/api/quick-search', async route => {
            await route.fulfill({ status: 500, json: { message: 'Internal Server Error' } });
        });

        await page.goto('/');
        await page.getByPlaceholder(/Rua de Belém/i).fill('Test St');
        await page.getByRole('button', { name: /Analyze|Analisar/i }).click();

        // Verify error message in UI (might be a toast or inline error)
        // Based on LandingPage.tsx, it sets searchError state
        await expect(page.getByText(/Search failed|Falha na pesquisa/i)).toBeVisible();
    });

    test('Dashboard redirects to landing on 401 Unauthorized', async ({ page }) => {
        await page.route('/api/auth/user', async route => {
            await route.fulfill({ status: 401, json: { message: 'Not authenticated' } });
        });

        await page.goto('/dashboard');

        // Should redirect to landing page
        await expect(page).toHaveURL('/');
    });

    test('Dashboard shows error when business creation fails', async ({ page }) => {
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com' } } });
        });
        await page.route('/api/businesses', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 500, json: { message: 'Creation failed' } });
            } else {
                await route.fulfill({ status: 200, json: [] });
            }
        });

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);

        // Try to add business
        await page.getByTestId('btn-add-business').click();
        await page.getByTestId('input-business-name').fill('Fail Business');
        await page.getByTestId('input-address').fill('123 Fail st');

        // Mock places search to bypass validation
        await page.route('**/api/places/search*', async route => {
            await route.fulfill({ status: 200, json: { results: [{ name: 'Fail Business', address: '123 Fail st' }] } });
        });

        await page.getByTestId('button-search-address').click();
        await page.getByTestId('select-business-type').click();
        await page.getByTestId('option-type-restaurant').click();

        await page.getByTestId('button-submit-business').click();

        // Verify error toast - should contain the mocked message "Creation failed"
        await expect(page.getByText(/Creation failed|Falha ao registar/i).first()).toBeVisible();
    });
});

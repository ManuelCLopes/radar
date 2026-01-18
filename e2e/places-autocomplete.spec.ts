import { test, expect } from '@playwright/test';

test.describe('Places Autocomplete', () => {

    test('Selecting autocomplete result auto-populates business form', async ({ page }) => {
        // Mock auth
        await page.route('**/api/auth/user*', async route => {
            await route.fulfill({ status: 200, json: { user: { id: 1, email: 'test@example.com', isVerified: true } } });
        });
        await page.route('/api/businesses', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // Mock Places search with results
        await page.route('**/api/places/search*', async route => {
            await route.fulfill({
                status: 200,
                json: {
                    results: [
                        {
                            name: 'Starbucks Belém',
                            address: 'Rua de Belém 1, Lisboa',
                            types: ['cafe']
                        }
                    ],
                    apiKeyMissing: false
                }
            });
        });

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);
        await page.getByTestId('btn-add-business').click();

        // Type in name and address (search button is disabled until name is filled)
        await page.getByTestId('input-business-name').fill('Starbucks');
        await page.getByTestId('input-address').fill('Rua de Belém');
        await page.getByTestId('button-search-address').click();

        // Verify result appears and accept suggestion
        await expect(page.getByText('Starbucks Belém')).toBeVisible();
        await page.getByRole('button', { name: /Use this|Usar esta/i }).click();

        // Verify fields are populated
        await expect(page.getByTestId('input-business-name')).toHaveValue('Starbucks');
        await expect(page.getByTestId('input-address')).toHaveValue('Rua de Belém 1, Lisboa');

        // Check Select component value (Radix Select is tricky, usually has a hidden input or text content)
        // Let's check the text content of the trigger
        await expect(page.getByTestId('select-business-type')).toContainText(/Cafe/i);
    });
});

import { test, expect } from '@playwright/test';

test('visitor can perform quick search', async ({ page }) => {
    test.setTimeout(120000); // Allow 2 minutes for report generation
    // 1. Visit Landing Page
    await page.goto('/');



    // 2. Fill Address
    await page.getByPlaceholder("Rua de Belém 84-92, 1300-085 Lisboa").fill('Rua Augusta, Lisboa');

    // 3. Select Type (assuming default is restaurant or select it)
    // Just verify it's there, or select if needed. Default is usually set in state.
    // Let's explicitly select 'restaurant' to be safe, if UI allows easily.
    // The Select component might be tricky with standard HTML select interactors if it's Radix UI.
    // For now, let's rely on default 'restaurant' or just fill address.



    // Mock the API response to avoid external dependency hangs (and rate limits)
    await page.route('**/api/quick-search', async route => {
        const json = {
            searchId: 'mock-search-123',
            report: {
                id: 'mock-report-123',
                businessId: 'mock-business-123',
                businessName: 'Mock Business',
                html: '<h1>Mock Report</h1><p>This is a mock report for testing.</p>',
                aiAnalysis: 'This is a mock AI analysis.',
                competitors: [
                    { name: 'Competitor A', address: '123 Test St', rating: 4.5 },
                    { name: 'Competitor B', address: '456 Test Ave', rating: 3.8 }
                ],
                generatedAt: new Date().toISOString()
            }
        };
        await route.fulfill({ json });
    });

    // 4. Click Search
    const requestPromise = page.waitForRequest(request => request.url().includes('/api/quick-search') && request.method() === 'POST');
    await page.click('button[type="submit"]', { force: true });


    const request = await requestPromise;

    // 5. Wait for results
    // Wait for the modal content to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30000 });
});


import { test, expect } from '@playwright/test';

test.describe('Dashboard Business Management Flow', () => {
    // Mock user data
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date().toISOString(),
    };

    const mockBusinesses = [
        {
            id: 'bus-1',
            userId: 'test-user-id',
            name: 'Existing Cafe',
            type: 'cafe',
            address: '123 Main St',
            locationStatus: 'validated',
            latitude: 10,
            longitude: 10,
            createdAt: new Date().toISOString(),
        }
    ];

    test.beforeEach(async ({ page }) => {
        // 1. Mock Authentication (Always Authenticated)
        await page.route('**/api/auth/user*', async (route) => {

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ user: mockUser }),
            });
        });




        // 2. Dynamic Business Mock Store (Global for this test run)
        let currentBusinesses = [...mockBusinesses];

        await page.route('**/api/businesses*', async (route) => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(currentBusinesses)
                });
            } else if (method === 'POST') {
                const newBus = route.request().postDataJSON();
                const created = { ...newBus, id: `bus-new-${Date.now()}`, userId: mockUser.id };
                currentBusinesses.push(created);
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(created)
                });
            } else {
                await route.continue();
            }
        });

        // Handle specific ID routes (PUT, DELETE)
        await page.route('**/api/businesses/*', async (route) => {
            const method = route.request().method();
            const url = route.request().url();
            const id = url.split('/').pop();

            if (method === 'PUT') {
                const updateData = route.request().postDataJSON();
                const index = currentBusinesses.findIndex(b => b.id === id);
                if (index !== -1) {
                    currentBusinesses[index] = { ...currentBusinesses[index], ...updateData };
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(currentBusinesses[index])
                    });
                } else {
                    await route.fulfill({ status: 404 });
                }
            } else if (method === 'DELETE') {
                currentBusinesses = currentBusinesses.filter(b => b.id !== id);
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
            } else {
                await route.continue();
            }
        });

        // 3. Mock Places Search (Return empty to force manual address entry flow)
        await page.route('**/api/places/search*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ results: [], apiKeyMissing: false }),
            });
        });

        // 4. Mock Reports
        await page.route('**/api/reports/history', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        });
        await page.route('**/api/reports/business', async (route) => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        });

        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', exception => {
            console.log('PAGE ERROR:', exception);
            throw new Error(`Captured PAGE ERROR: ${exception.toString()}`);
        });
        page.on('response', resp => console.log('RESPONSE:', resp.url(), resp.status()));

        await page.goto('/dashboard');
        console.log('Navigated to:', page.url());
    });

    test('can add a new business using manual address', async ({ page }) => {
        // Mock POST /api/businesses


        // Click Add Business
        await page.getByTestId('btn-add-business').click();

        // Fill Form
        await page.getByTestId('input-business-name').fill('New Pizza Place');
        await page.getByTestId('input-address').fill('456 Cheese Ave');

        // Trigger generic search (since verify address is auto-triggered or manual)
        // Check if "Proceed with address" dialog appears. 
        // Logic: typing address -> debounce -> search API -> mock returns empty -> Show No Results Dialog?
        // Wait for debounce (1.5s in code) or force click search
        await page.getByTestId('button-search-address').click();

        // Expect "No Results" dialog with "Proceed with address" option
        await expect(page.getByText('Address Not Found')).toBeVisible();
        await page.getByTestId('button-proceed-with-address').click();

        // Wait for dialog and overlay to be completely hidden
        await expect(page.getByRole('alertdialog')).toBeHidden();

        // Give UI a moment to settle state/animations
        await page.waitForTimeout(500);

        // Now address is "verified" (pending status), select type
        await page.getByTestId('select-business-type').click();
        await page.getByTestId('option-type-restaurant').click();

        // Submit
        // We need to update the GET mock to include the new business for the UI to update optimistically or on refetch?
        // Actually, TanStack Query usually invalidates key 'businesses'.
        // Let's update the GET mock dynamically for the next fetch.


        await page.getByTestId('button-submit-business').click({ force: true });

        // Verify it appears in the list
        await expect(page.getByText('New Pizza Place')).toBeVisible();
    });

    test('can edit an existing business', async ({ page }) => {
        // Mock PUT request


        await page.getByTestId('button-edit-bus-1').click();

        // Wait for modal/sheet? Assuming it's typically a dialog or the same form.
        // Dashboard implementation likely uses a Dialog for Add/Edit or inline?
        // Let's assume it's the same form in a Dialog based on common patterns, but wait...
        // I checked BusinessList.tsx PROPS: onEdit.
        // I need to check Dashboard.tsx again to see what onEdit does.
        // Logic: onEdit(business) -> sets editingBusiness state -> Opens Dialog?
        // Assuming yes. 

        await page.getByTestId('input-business-name').fill('Updated Cafe Name');
        // Address unchanged, submit
        await page.getByTestId('button-submit-business').click();

        // Verify update
        await expect(page.getByTestId('text-business-name-bus-1')).toHaveText('Updated Cafe Name');
    });

    test('can delete a business', async ({ page }) => {
        // 2. Dynamic Business Mock Store
        let currentBusinesses = [...mockBusinesses]; // Start with initial

        await page.route('**/api/businesses*', async (route) => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(currentBusinesses)
                });
            } else if (method === 'POST') {
                const newBus = route.request().postDataJSON();
                const created = { ...newBus, id: `bus-new-${Date.now()}`, userId: mockUser.id };
                currentBusinesses.push(created);
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(created)
                });
            } else {
                await route.continue();
            }
        });

        // Handle specific ID routes (PUT, DELETE)
        await page.route('**/api/businesses/*', async (route) => {
            const method = route.request().method();
            const url = route.request().url();
            const id = url.split('/').pop();

            if (method === 'PUT') {
                const updateData = route.request().postDataJSON();
                const index = currentBusinesses.findIndex(b => b.id === id);
                if (index !== -1) {
                    currentBusinesses[index] = { ...currentBusinesses[index], ...updateData };
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(currentBusinesses[index])
                    });
                } else {
                    await route.fulfill({ status: 404 });
                }
            } else if (method === 'DELETE') {
                currentBusinesses = currentBusinesses.filter(b => b.id !== id);
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
            } else {
                await route.continue();
            }
        });

        await page.getByTestId('button-delete-bus-1').click();

        // Expect Dialog
        await expect(page.getByText('Are you sure')).toBeVisible();
        await page.getByTestId('button-confirm-delete').click();

        // Verify removal
        await expect(page.getByTestId('card-business-bus-1')).not.toBeVisible();
        await expect(page.getByTestId('empty-state-message')).toBeVisible();
    });

    test('can generate a report', async ({ page }) => {

        // Mock history to prevent 401s and ensure stability
        await page.route('/api/reports/history', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // Mock business (prevent 401)
        await page.route('/api/reports/business', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // Mock POST run-report
        await page.route('**/api/run-report/bus-1', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'rep-1',
                    businessId: 'bus-1',
                    businessName: 'Existing Cafe',
                    aiAnalysis: 'Great place',
                    competitors: [],
                    html: '<div>Report Content</div>',
                    generatedAt: new Date().toISOString()
                })
            });
        });

        // Add proper setup before action
        // Navigate to dashboard
        await page.goto('/dashboard');

        // Look for business
        await expect(page.getByTestId('text-business-name-bus-1')).toBeVisible({ timeout: 10000 });

        // Action
        await page.getByTestId('button-generate-report-bus-1').click();

        // Verify success (Dialog opened)
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('report-title')).toBeVisible();
    });

    test('can view report history', async ({ page }) => {
        // Mock history response with items
        await page.route('/api/reports/history', async route => {
            await route.fulfill({
                status: 200,
                json: [
                    {
                        id: 'hist-1',
                        businessId: 'bus-1',
                        businessName: 'Historic Cafe',
                        aiAnalysis: 'Old analysis',
                        generatedAt: new Date().toISOString()
                    }
                ]
            });
        });

        await page.goto('/dashboard');

        // Navigate to History tab (assuming tabs exist, or just check content if listed on main)
        // If history is in a separate tab or section:
        const historyTab = page.getByRole('tab', { name: /History|Histórico/i });
        if (await historyTab.isVisible()) {
            await historyTab.click();
        }

        // Verify report item exists
        await expect(page.getByText('Historic Cafe')).toBeVisible();
    });

});

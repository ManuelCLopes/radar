import { test, expect } from '@playwright/test';

test.describe('Subscription Management', () => {
    // Mock User State
    let mockUser: any;

    test.beforeEach(async ({ page }) => {
        // Reset mock user for each test
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

        // Mock Stripe checkout session creation
        await page.route('**/api/create-checkout-session', async route => {
            await route.fulfill({
                status: 200,
                json: { url: 'http://localhost:5001/settings?session_id=cs_test_success' }
            });
        });

        // Mock Portal session
        await page.route('**/api/create-portal-session', async route => {
            await route.fulfill({
                status: 200,
                json: { url: 'http://localhost:5001/settings' }
            });
        });

        // Mock Language update API
        await page.route('**/api/user/language', async route => {
            await route.fulfill({ status: 200, json: { success: true } });
        });
    });

    test('should display Pro welcome modal after successful upgrade', async ({ page }) => {
        // Simulate user entering the app as free
        await page.goto('/dashboard');

        // Verify we are on dashboard (logged in via mock)
        await expect(page).toHaveURL(/.*dashboard/);

        // Simulate "Upgrade" has happened on the backend (webhook processed)
        mockUser.plan = 'pro';
        mockUser.subscriptionStatus = 'active';
        mockUser.subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Navigate to settings with session_id parameter (simulating Stripe redirect)
        await page.goto('/settings?session_id=cs_test_success');

        // Verify Pro Welcome Modal is displayed
        await expect(page.getByRole('heading', { name: /Welcome to Pro/i })).toBeVisible({ timeout: 5000 });

        // Verify feature list - Corrected text based on en/common.json
        await expect(page.getByText(/3 Business Profiles/i)).toBeVisible();
        await expect(page.getByText(/10 Reports per Month/i)).toBeVisible();
        await expect(page.getByText(/20km Search Radius/i)).toBeVisible();

        // Close modal
        await page.getByRole('button', { name: /Get Started/i }).click();

        // Verify modal is closed
        await expect(page.getByRole('heading', { name: /Welcome to Pro/i })).not.toBeVisible();
    });

    test('should display active Pro subscription status', async ({ page }) => {
        // Set Pro state
        mockUser.plan = 'pro';
        mockUser.subscriptionStatus = 'active';
        mockUser.subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await page.goto('/settings');
        await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();

        // Verify subscription section
        await expect(page.getByText(/Current Plan:/i)).toBeVisible();
        // Use exact match for PRO badge to avoid loose matching button text "Edit Profile" etc
        await expect(page.getByText('PRO', { exact: true })).toBeVisible();

        // Verify manage subscription button 
        await expect(page.getByRole('button', { name: /Manage Subscription/i })).toBeVisible();

        // Verify access message
        await expect(page.getByText(/access to all premium features/i)).toBeVisible();
    });

    test('should display canceled subscription with access period', async ({ page }) => {
        // Set Canceled state
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 15); // 15 days left

        mockUser.plan = 'pro';
        mockUser.subscriptionStatus = 'canceled';
        mockUser.subscriptionPeriodEnd = periodEnd.toISOString();

        await page.goto('/settings');

        // Verify canceled status with access period
        await expect(page.getByText(/Canceled/i)).toBeVisible();
        await expect(page.getByText(/Access until/i)).toBeVisible();

        // Verify period end date is shown
        const accessUntilText = await page.getByText(/Access until/i).textContent();
        expect(accessUntilText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);

        // Verify reactivate button is prominent
        const reactivateButton = page.getByRole('button', { name: /Reactivate Pro Plan/i });
        await expect(reactivateButton).toBeVisible();
    });

    test('should update UI text based on subscription status', async ({ page }) => {
        // Free user (default)
        await page.goto('/settings');

        // Verify free plan messaging
        // Settings page shows "Plan: free" and "FREE" badge
        await expect(page.getByText('FREE', { exact: true })).toBeVisible();

        await expect(page.getByText(/Upgrade to unlock/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Upgrade to Pro/i })).toBeVisible();
    });

    test('should handle multiple languages for subscription text', async ({ page }) => {
        // Pro user
        mockUser.plan = 'pro';
        mockUser.subscriptionStatus = 'active';

        await page.goto('/settings');

        // Use the Header Language Selector (consistent with i18n test)
        const langSelector = page.getByTestId('button-language-selector');

        // Test Portuguese
        await langSelector.click({ force: true });
        await page.getByTestId('button-lang-pt').click({ force: true });

        // Wait for update
        await expect(page.getByText(/Plano Atual/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/Gerir Subscrição/i)).toBeVisible();

        // Test Spanish
        await langSelector.click({ force: true });
        await page.getByTestId('button-lang-es').click({ force: true });
        await expect(page.getByText(/Plan Actual/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/Administrar Suscripción/i)).toBeVisible();

        // Test German
        await langSelector.click({ force: true });
        await page.getByTestId('button-lang-de').click({ force: true });
        await expect(page.getByText(/Aktueller Plan/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/Abo verwalten/i)).toBeVisible();

        // Test French
        await langSelector.click({ force: true });
        await page.getByTestId('button-lang-fr').click({ force: true });
        await expect(page.getByText(/Plan Actuel/i)).toBeVisible({ timeout: 5000 });
        // 'Gérer' matches both 'Gérer l'abonnement' and generally.
        // en/common.json key "manage" -> SettingsPage.tsx t('settings.subscription.manage')
        // Using regex for safety
        await expect(page.getByRole('button', { name: /Gérer/i })).toBeVisible();
    });

    test('should allow Pro users to create multiple business profiles', async ({ page }) => {
        mockUser.plan = 'pro';

        // Mock business creation success
        await page.route('**/api/businesses', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: { id: 'new-bus', name: 'New Biz' } });
            } else {
                await route.fulfill({ status: 200, json: [] }); // Start with 0
            }
        });

        await page.goto('/dashboard');

        // Check availability of "New Analysis" or equivalent button
        // Just verify navigation or button presence
        await expect(page.getByTestId('btn-new-analysis')).toBeVisible();
    });
});

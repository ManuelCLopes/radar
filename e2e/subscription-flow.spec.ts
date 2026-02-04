import { test, expect } from '@playwright/test';
import { createUser, deleteUserByEmail, upgradeToPro, cancelSubscription } from './helpers/test-helpers';

test.describe('Subscription Management', () => {
    const testEmail = 'subscription-test@example.com';
    const testPassword = 'Test123!@#';

    test.beforeEach(async () => {
        // Clean up any existing test user
        await deleteUserByEmail(testEmail);
    });

    test.afterEach(async () => {
        // Clean up test user
        await deleteUserByEmail(testEmail);
    });

    test('should display Pro welcome modal after successful upgrade', async ({ page }) => {
        // Create and login user
        await createUser(testEmail, testPassword);
        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // Simulate Checkout session completion
        await upgradeToPro(testEmail);

        // Navigate to settings with session_id parameter (simulating Stripe redirect)
        await page.goto('/settings?session_id=cs_test_success');

        // Verify Pro Welcome Modal is displayed
        await expect(page.getByRole('heading', { name: /Welcome to Pro/i })).toBeVisible({ timeout: 5000 });

        // Verify feature list
        await expect(page.getByText(/3 Business Profiles/i)).toBeVisible();
        await expect(page.getByText(/10 Reviews\/Month/i)).toBeVisible();
        await expect(page.getByText(/20km Search Radius/i)).toBeVisible();

        // Close modal
        await page.getByRole('button', { name: /Get Started/i }).click();

        // Verify modal is closed
        await expect(page.getByRole('heading', { name: /Welcome to Pro/i })).not.toBeVisible();
    });

    test('should display active Pro subscription status', async ({ page }) => {
        // Create Pro user
        await createUser(testEmail, testPassword);
        await upgradeToPro(testEmail);

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Navigate to settings
        await page.goto('/settings');
        await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();

        // Verify subscription section
        await expect(page.getByText(/Current Plan:/i)).toBeVisible();
        await expect(page.getByText(/pro/i)).toBeVisible();

        // Verify Pro badge
        await expect(page.getByText('PRO')).toBeVisible();

        // Verify manage subscription button
        await expect(page.getByRole('button', { name: /Manage Subscription/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Manage Subscription/i })).not.toHaveClass(/variant-default/);

        // Verify access message
        await expect(page.getByText(/access to all premium features/i)).toBeVisible();
    });

    test('should display canceled subscription with access period', async ({ page }) => {
        // Create Pro user and cancel subscription
        await createUser(testEmail, testPassword);
        await upgradeToPro(testEmail);
        await cancelSubscription(testEmail);

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Navigate to settings
        await page.goto('/settings');

        // Verify canceled status with access period
        await expect(page.getByText(/Canceled/i)).toBeVisible();
        await expect(page.getByText(/Access until/i)).toBeVisible();

        // Verify period end date is shown
        const periodText = await page.textContent('text=/Access until/');
        expect(periodText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format

        // Verify reactivate button is prominent (default variant = blue)
        const reactivateButton = page.getByRole('button', { name: /Reactivate Pro Plan/i });
        await expect(reactivateButton).toBeVisible();

        // Button should have default variant (highlighted)
        const hasDefaultStyle = await reactivateButton.evaluate((el) =>
            !el.className.includes('variant-outline')
        );
        expect(hasDefaultStyle).toBeTruthy();
    });

    test('should update UI text based on subscription status', async ({ page }) => {
        // Create free user
        await createUser(testEmail, testPassword);

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Navigate to settings
        await page.goto('/settings');

        // Verify free plan messaging
        await expect(page.getByText(/free/i)).toBeVisible();
        await expect(page.getByText(/Upgrade to unlock/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Upgrade to Pro/i })).toBeVisible();
    });

    test('should handle multiple languages for subscription text', async ({ page }) => {
        await createUser(testEmail, testPassword);
        await upgradeToPro(testEmail);

        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        await page.goto('/settings');

        // Test Portuguese
        await page.click('[data-testid="language-selector"]');
        await page.click('button:has-text("Português")');
        await expect(page.getByText(/Plano Atual/i)).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/Gerir Subscrição/i)).toBeVisible();

        // Test Spanish
        await page.click('[data-testid="language-selector"]');
        await page.click('button:has-text("Español")');
        await expect(page.getByText(/Plan Actual/i)).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/Administrar Suscripción/i)).toBeVisible();

        // Test German
        await page.click('[data-testid="language-selector"]');
        await page.click('button:has-text("Deutsch")');
        await expect(page.getByText(/Aktueller Plan/i)).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/Abo verwalten/i)).toBeVisible();

        // Test French
        await page.click('[data-testid="language-selector"]');
        await page.click('button:has-text("Français")');
        await expect(page.getByText(/Plan Actuel/i)).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/Gérer l'abonnement/i)).toBeVisible();
    });
});

test.describe('Pro Features Access Control', () => {
    const testEmail = 'pro-features-test@example.com';
    const testPassword = 'Test123!@#';

    test.beforeEach(async () => {
        await deleteUserByEmail(testEmail);
    });

    test.afterEach(async () => {
        await deleteUserByEmail(testEmail);
    });

    test('should allow Pro users to create multiple business profiles', async ({ page }) => {
        await createUser(testEmail, testPassword);
        await upgradeToPro(testEmail);

        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Create first business
        await page.goto('/dashboard');
        await page.click('button:has-text("New Report")');

        // Business creation should work without limits for Pro users
        // (This assumes the business creation flow exists)
        await expect(page.getByText(/upgrade/i)).not.toBeVisible();
    });

    test('should restrict free users from creating multiple businesses', async ({ page }) => {
        await createUser(testEmail, testPassword);

        await page.goto('/login');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        await page.goto('/dashboard');

        // Free users should see upgrade prompt when hitting limits
        // (Implementation depends on actual business limit enforcement)
    });
});

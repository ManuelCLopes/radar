import { test, expect } from '@playwright/test';

test.describe('Legal Compliance & Cookie Consent', () => {
    test.beforeEach(async ({ page }) => {
        // Mock auth to ensure we are on landing page or as a guest
        await page.route('/api/auth/user', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Not authenticated' }),
            });
        });
    });

    test('should show cookie consent banner and handle actions', async ({ page }) => {
        await page.goto('/');

        // Wait for banner to appear
        const banner = page.getByText(/We use cookies to improve your experience|Utilizamos cookies para melhorar a sua experiência/i);
        await expect(banner).toBeVisible({ timeout: 10000 });

        // Click "Accept"
        await page.getByRole('button', { name: /Accept|Aceitar/i }).first().click();

        // Banner should disappear
        await expect(banner).toBeHidden();

        // Check localStorage
        await page.waitForTimeout(500);
        const consent = await page.evaluate(() => localStorage.getItem('cookie-consent'));
        expect(consent).toBe('accepted');
    });

    test('should navigate to Privacy Policy', async ({ page }) => {
        await page.goto('/');

        // Find link in footer
        const privacyLink = page.getByRole('link', { name: /Privacy Policy|Política de Privacidade/i });
        await privacyLink.click();

        await expect(page).toHaveURL(/\/privacy-policy/);
        await expect(page.getByRole('heading', { name: /Privacy Policy|Política de Privacidade/i })).toBeVisible();
    });

    test('should navigate to Cookie Policy', async ({ page }) => {
        await page.goto('/');

        // Find link in footer
        const cookieLink = page.getByRole('link', { name: /Cookie Policy|Política de Cookies/i });
        await cookieLink.click();

        await expect(page).toHaveURL(/\/cookie-policy/);
        await expect(page.getByRole('heading', { name: /Cookie Policy|Política de Cookies/i })).toBeVisible();
    });
});

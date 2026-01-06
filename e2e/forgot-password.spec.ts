import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {

    test('visitor can request password reset', async ({ page }) => {
        // Mock the API response
        await page.route('/api/auth/forgot-password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: "Password reset email sent" })
            });
        });

        await page.goto('/login');

        // Find and click 'Forgot password?' link
        await page.getByRole('link', { name: /Forgot password|Esqueceu-se da palavra-passe/i }).click();

        // Verify navigation
        await expect(page).toHaveURL(/.*\/forgot-password/);

        // Fill email
        await page.getByPlaceholder('you@example.com').fill('test@example.com');

        // Submit
        await page.getByRole('button', { name: /Send reset link|Enviar email de recuperação/i }).click();

        // Verify success state (check visual feedback)
        // Assuming a toast or text appearing saying email sent
        await expect(page.getByText(/receive a recovery link|recovery link shortly/i)).toBeVisible();
    });

});

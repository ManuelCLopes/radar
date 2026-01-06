import { test, expect } from '@playwright/test';

test.describe('Reset Password Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock token verification
        await page.route('/api/auth/verify-reset-token/mock-valid-token', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ valid: true }),
            });
        });

        await page.route('/api/auth/verify-reset-token/mock-invalid-token', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ valid: false, error: 'Invalid or expired token' }),
            });
        });

        // Mock password reset submission
        await page.route('/api/auth/reset-password', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Password reset successful' }),
            });
        });
    });

    test('should show error for invalid token', async ({ page }) => {
        await page.goto('/reset-password/mock-invalid-token');
        await expect(page.getByText(/Invalid or expired token|Token inválido ou expirado/i)).toBeVisible();
    });

    test('should successfully reset password with valid token', async ({ page }) => {
        await page.goto('/reset-password/mock-valid-token');

        // Wait for validation to complete and form to be visible
        await expect(page.getByText(/Choose a new password|Escolha uma nova password/i)).toBeVisible({ timeout: 10000 });

        // Fill new password
        await page.locator('#newPassword').fill('new-password-123');
        await page.locator('#confirmPassword').fill('new-password-123');

        // Submit - using the title of the card as a selector for the button text
        await page.getByRole('button', { name: /Reset Password|Redefinir Password/i }).click();

        // Verify success
        await expect(page.getByText(/Your password has been reset successfully|Password redefinida com sucesso/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('link', { name: /Go to Login|Ir para Login/i })).toBeVisible();
    });

    test('should show error on password mismatch', async ({ page }) => {
        await page.goto('/reset-password/mock-valid-token');
        await expect(page.getByText(/Choose a new password|Escolha uma nova password/i)).toBeVisible();

        await page.locator('#newPassword').fill('password123');
        await page.locator('#confirmPassword').fill('password456');

        await page.getByRole('button', { name: /Reset Password|Redefinir Password/i }).click();

        await expect(page.getByText(/Passwords do not match|As palavras-passe não coincidem/i)).toBeVisible();
    });
});

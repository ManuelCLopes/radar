import { test, expect } from '@playwright/test';

test.describe('Authentication Form Validation', () => {

    test('Registration shows validation errors for invalid inputs', async ({ page }) => {
        await page.goto('/register');

        // Test Empty Email/Password
        const signupBtn = page.getByRole('button', { name: /Sign Up|Criar Conta/i });
        await signupBtn.click();
        await expect(page.getByText(/required|obrigatório/i).first()).toBeVisible();

        // Test Invalid Email
        await page.getByLabel(/Email/i).fill('invalid-email');
        await signupBtn.click();
        await expect(page.getByText(/valid email|e-mail válido/i)).toBeVisible();

        // Test Short Password
        await page.getByLabel(/Password|Senha/i).fill('123');
        await signupBtn.click();
        await expect(page.getByText(/at least 6 characters|pelo menos 6 caracteres/i)).toBeVisible();
    });

    test('Login shows error on failed authentication', async ({ page }) => {
        // Mock 401 response for login
        await page.route('/api/login', async route => {
            await route.fulfill({
                status: 401,
                json: { message: 'Invalid credentials' }
            });
        });

        await page.goto('/login');

        await page.getByLabel(/Email/i).fill('wrong@example.com');
        await page.getByLabel(/Password|Senha/i).fill('wrongpassword');
        await page.getByRole('button', { name: /Log In|Entrar|Iniciar Sessão/i }).click();

        // Verify error message
        await expect(page.getByText(/incorrect|incorret/i)).toBeVisible();
    });

    test('Password reset validation (token page)', async ({ page }) => {
        // Mock token validation failure
        // The component calls /api/auth/verify-reset-token/${token}
        await page.route('**/api/auth/verify-reset-token/*', async route => {
            await route.fulfill({ status: 200, json: { valid: false } });
        });

        await page.goto('/reset-password/invalid-token');

        // Verify invalid token message with longer timeout
        await expect(page.getByText(/Invalid or expired token|Token inválido ou expirado/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('link', { name: /Back|Voltar|Login/i }).first()).toBeVisible();
    });
});

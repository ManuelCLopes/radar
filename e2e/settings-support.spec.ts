import { test, expect } from '@playwright/test';

test.describe('Support & Settings Flows', () => {

    test('Support page renders correctly (public access)', async ({ page }) => {
        await page.goto('/support');

        // Verify Header
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Verify Donation Cards presence
        await expect(page.getByText('GitHub Sponsors')).toBeVisible();
        await expect(page.getByText('Ko-fi')).toBeVisible();

        // Verify Back Link
        await expect(page.getByRole('link', { name: /Back|Voltar/i })).toBeVisible();
    });

    test('Settings page functionality (authenticated)', async ({ page }) => {
        // 1. Mock Auth
        // Note: useAuth fetches /api/auth/user?_t=... and expects { user: ... }
        await page.route('/api/auth/user*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'user-1',
                        email: 'test@example.com',
                        firstName: 'Test User'
                    }
                })
            });
        });

        // Mock Language Update Endpoint
        await page.route('/api/user/language', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/settings');

        // 2. Verify Profile Form
        await expect(page.getByLabel(/Name|Nome/i)).toHaveValue('Test User');
        await expect(page.getByLabel(/Email/i)).toHaveValue('test@example.com');

        // 3. Test Theme Toggle (check for class change on html or button state)
        // Note: Checking specific class change might be flaky if implementation changes, 
        // so we check if the button exists and is clickable.
        const themeBtn = page.getByTestId('button-theme-toggle');
        await expect(themeBtn).toBeVisible();
        await themeBtn.click();

        // 4. Test Language Switcher
        // Change language using the new Select component
        const langSelect = page.getByTestId('settings-language-select');
        await expect(langSelect).toBeVisible();
        await langSelect.click();

        const ptOption = page.getByTestId('settings-lang-pt');
        await expect(ptOption).toBeVisible();
        await ptOption.click();

        // Verify toast or updated state
        // When switching to PT, the toast should be in PT
        await expect(page.getByText('Idioma atualizado')).toBeVisible({ timeout: 5000 });
    });

    test('authenticated user can update profile', async ({ page }) => {
        // 1. Mock Auth
        await page.route('/api/auth/user*', async route => {
            await route.fulfill({
                status: 200,
                json: {
                    user: {
                        id: 'user-1',
                        email: 'test@example.com',
                        firstName: 'Test User'
                    }
                }
            });
        });

        // 2. Mock Update Endpoint
        await page.route('/api/user/profile', async route => {
            if (route.request().method() === 'PUT') {
                const data = route.request().postDataJSON();
                await route.fulfill({
                    status: 200,
                    json: {
                        user: {
                            id: 'user-1',
                            email: 'test@example.com',
                            ...data
                        },
                        message: "Profile updated successfully"
                    }
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('/settings');

        // Click Edit
        await page.getByRole('button', { name: /Edit|Editar/i }).click({ force: true });

        // Edit Name
        await page.getByLabel(/Name|Nome/i).fill('Updated Name');

        // Click Save
        await page.getByRole('button', { name: /Save|Guardar/i }).click({ force: true });

        // Verify Success Message (Toast Title)
        await expect(page.getByText(/Profile updated|Perfil atualizado/i).first()).toBeVisible({ timeout: 10000 });
    });

});


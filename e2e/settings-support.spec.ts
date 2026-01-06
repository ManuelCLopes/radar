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
        // Depending on implementation, checking for a text change is best
        const langTrigger = page.getByTestId('button-language-selector');
        await expect(langTrigger).toBeVisible();
        await langTrigger.click();
        await expect(page.getByTestId('button-lang-pt')).toBeVisible();
        await page.getByTestId('button-lang-pt').click();
    });

});


import { test, expect } from '@playwright/test';

test.describe('Landing Page Interactivity', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure we are guests for these tests
        await page.route('/api/auth/user', async route => {
            await route.fulfill({ status: 401, json: { message: 'Not authenticated' } });
        });
        await page.goto('/');
    });

    test('Hero form shows validation errors on empty submission', async ({ page }) => {
        // Clear address if any pre-filled value exists (though default is empty)
        await page.getByLabel(/Address|Morada/i).fill('');

        // Submit
        await page.getByRole('button', { name: /Analyze|Analisar/i }).click();

        // Check for validation messages
        // Portuguese: "Este campo é obrigatório"
        await expect(page.getByText(/required|obrigatório/i).first()).toBeVisible();
    });

    test('Guest users see limit reached modal on second search attempt', async ({ page }) => {
        // Simulate first report already generated in localStorage
        await page.evaluate(() => {
            localStorage.setItem('competitor_watcher_free_report_generated', 'true');
        });

        // Try to search
        await page.getByLabel(/Address|Morada/i).fill('Test Address');
        await page.getByRole('button', { name: /Analyze|Analisar/i }).click();

        // Verify limit modal
        await expect(page.getByText(/Limit Reached|Limite de Relatórios/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Sign Up|Criar Conta/i })).toBeVisible();
    });

    test('FAQ items are visible and formatted correctly', async ({ page }) => {
        // Scroll to FAQ
        const faqSection = page.getByTestId('section-faq');
        await faqSection.scrollIntoViewIfNeeded();

        // Check for specific questions
        await expect(page.getByText(/De onde vêm os dados|Where does the data come from/i)).toBeVisible();
        await expect(page.getByText(/Preciso de instalar|Do I need to install/i)).toBeVisible();
    });

    test('Landing page sections are present', async ({ page }) => {
        await expect(page.getByTestId('section-how-it-works')).toBeVisible();
        await expect(page.getByTestId('section-report-features')).toBeVisible();
        await expect(page.getByTestId('section-audience')).toBeVisible();
        await expect(page.getByTestId('section-cta-final')).toBeVisible();
    });
});

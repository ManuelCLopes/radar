import { test, expect } from '@playwright/test';

// Mock user data
const mockUser = {
    id: 123,
    email: 'test@example.com',
    isVerified: true,
    firstName: 'Test',
    lastName: 'User',
    plan: 'free',
    role: 'user',
    createdAt: new Date().toISOString()
};

test.describe('Authentication Flow', () => {

    test('visitor can register a new account', async ({ page }) => {
        let isAuthenticated = false;

        // Dynamic auth check mock
        await page.route('**/api/auth/user*', async route => {
            if (isAuthenticated) {
                await route.fulfill({ json: { user: mockUser } });
            } else {
                await route.fulfill({ status: 401 });
            }
        });

        // Mock registration endpoint
        await page.route('**/api/register', async route => {
            isAuthenticated = true; // Update state
            await route.fulfill({ json: mockUser });
        });

        await page.goto('/register');

        // Fill registration form
        await page.getByPlaceholder('John').fill('Test');
        await page.getByPlaceholder('Doe').fill('User');
        await page.getByPlaceholder('you@example.com').fill('test@example.com');
        await page.getByPlaceholder('••••••••').fill('password123');

        // Submit
        await page.click('button[type="submit"]');

        // Verify redirect to dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // Verify dashboard content (using robust test id)
        await expect(page.getByTestId('btn-add-business')).toBeVisible({ timeout: 10000 });
    });

    test('existing user can login', async ({ page }) => {
        let isAuthenticated = false;

        // Dynamic auth check mock
        await page.route('**/api/auth/user*', async route => {
            if (isAuthenticated) {
                await route.fulfill({ json: { user: mockUser } });
            } else {
                await route.fulfill({ status: 401 });
            }
        });

        // Mock login endpoint
        await page.route('**/api/login', async route => {
            isAuthenticated = true; // Update state
            await route.fulfill({ json: mockUser });
        });

        await page.goto('/login');

        // Fill login form
        await page.getByPlaceholder('you@example.com').fill('test@example.com');
        await page.getByPlaceholder('••••••••').fill('password123');

        // Submit
        await page.click('button[type="submit"]');

        // Verify redirect to dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // Verify dashboard content
        await expect(page.getByTestId('btn-add-business')).toBeVisible({ timeout: 10000 });
    });

});

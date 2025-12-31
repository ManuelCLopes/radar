import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '../ForgotPasswordPage';
import * as queryClient from '@/lib/queryClient';

// Mock hooks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    }),
}));

vi.mock('wouter', () => ({
    Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock apiRequest
vi.mock('@/lib/queryClient', () => ({
    apiRequest: vi.fn(),
    queryClient: {
        invalidateQueries: vi.fn(),
    }
}));

// Mock ThemeToggle and LanguageSelector
vi.mock("@/components/ThemeToggle", () => ({
    ThemeToggle: () => <div data-testid="theme-toggle" />,
}));
vi.mock("@/components/LanguageSelector", () => ({
    LanguageSelector: () => <div data-testid="language-selector" />,
}));

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ForgotPasswordPage />);

        expect(screen.getByText('auth.forgotPasswordTitle')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /auth.sendResetLink/i })).toBeInTheDocument();
    });

    it('handles successful submission', async () => {
        vi.mocked(queryClient.apiRequest).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' })
        } as Response);

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText('auth.email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: /auth.sendResetLink/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(queryClient.apiRequest).toHaveBeenCalledWith("POST", "/api/auth/forgot-password", {
                email: "test@example.com",
                language: "en"
            });
            expect(screen.getByText(/auth.resetSuccess/i)).toBeInTheDocument();
        });
    });

    it('handles submission error', async () => {
        vi.mocked(queryClient.apiRequest).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Failed to send' })
        } as Response);

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText('auth.email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: /auth.sendResetLink/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Failed to send')).toBeInTheDocument();
        });
    });
});

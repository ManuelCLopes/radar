import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPasswordPage from '../ResetPasswordPage';
import * as queryClient from '@/lib/queryClient';

// Mock hooks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => options?.min ? `${key}` : key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    }),
}));

vi.mock('wouter', async () => {
    const actual = await vi.importActual('wouter');
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue(['/reset-password/valid-token', { split: () => ['', 'reset-password', 'valid-token'] }]),
        Link: ({ children, href }: any) => <a href={href}>{children}</a>
    };
});

// Mock apiRequest
vi.mock('@/lib/queryClient', () => ({
    apiRequest: vi.fn(),
    queryClient: {
        invalidateQueries: vi.fn(),
    }
}));

// Mock fetch for token validation
global.fetch = vi.fn();

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates token on mount', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ valid: true })
        } as Response);

        const { container } = render(<ResetPasswordPage />);

        // Should show loader initially
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByLabelText('auth.newPassword')).toBeInTheDocument();
        });
    });

    it('shows error for invalid token', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ valid: false, error: 'auth.invalidToken' })
        } as Response);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByText('auth.invalidToken')).toBeInTheDocument();
            expect(screen.getByText('auth.requestNewLink')).toBeInTheDocument();
        });
    });

    it('handles password mismatch', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ valid: true })
        } as Response);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByLabelText('auth.newPassword')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('auth.newPassword'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'mismatch' } });

        fireEvent.click(screen.getByRole('button', { name: /auth.resetPasswordTitle/i }));

        expect(screen.getByText('auth.passwordMismatch')).toBeInTheDocument();
    });

    it('handles successful reset', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ valid: true })
        } as Response);

        vi.mocked(queryClient.apiRequest).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' })
        } as Response);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByLabelText('auth.newPassword')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('auth.newPassword'), { target: { value: 'newpassword123' } });
        fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'newpassword123' } });

        fireEvent.click(screen.getByRole('button', { name: /auth.resetPasswordTitle/i }));

        await waitFor(() => {
            expect(screen.getByText(/auth.resetComplete/i)).toBeInTheDocument();
        });
    });
});

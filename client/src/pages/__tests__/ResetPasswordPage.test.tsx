import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPasswordPage from '../ResetPasswordPage';
import * as queryClient from '@/lib/queryClient';

// Mock wouter
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
            expect(screen.getByLabelText('Nova Password')).toBeInTheDocument();
        });
    });

    it('shows error for invalid token', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ valid: false, error: 'Token inválido' })
        } as Response);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByText('Token inválido')).toBeInTheDocument();
            expect(screen.getByText('Solicitar novo link')).toBeInTheDocument();
        });
    });

    it('handles password mismatch', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ valid: true })
        } as Response);

        render(<ResetPasswordPage />);

        await waitFor(() => {
            expect(screen.getByLabelText('Nova Password')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Nova Password'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Confirmar Password'), { target: { value: 'mismatch' } });

        fireEvent.click(screen.getByRole('button', { name: /redefinir password/i }));

        expect(screen.getByText('As passwords não coincidem')).toBeInTheDocument();
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
            expect(screen.getByLabelText('Nova Password')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Nova Password'), { target: { value: 'newpassword123' } });
        fireEvent.change(screen.getByLabelText('Confirmar Password'), { target: { value: 'newpassword123' } });

        fireEvent.click(screen.getByRole('button', { name: /redefinir password/i }));

        await waitFor(() => {
            expect(screen.getByText(/sucesso/i)).toBeInTheDocument();
        });
    });
});

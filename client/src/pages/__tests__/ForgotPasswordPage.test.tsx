import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '../ForgotPasswordPage';
import * as queryClient from '@/lib/queryClient';

// Mock hooks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
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

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ForgotPasswordPage />);

        expect(screen.getByText('Recuperar Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument();
    });

    it('handles successful submission', async () => {
        vi.mocked(queryClient.apiRequest).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' })
        } as Response);

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText('Email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: /enviar link/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/receberá um link/i)).toBeInTheDocument();
        });
    });

    it('handles submission error', async () => {
        vi.mocked(queryClient.apiRequest).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Failed to send' })
        } as Response);

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText('Email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: /enviar link/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Failed to send')).toBeInTheDocument();
        });
    });
});

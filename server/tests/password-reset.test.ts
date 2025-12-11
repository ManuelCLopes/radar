import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { createServer } from 'http';

// Mock OpenAI to prevent instantiation error
vi.mock('openai', () => {
    return {
        default: class OpenAI {
            chat = { completions: { create: vi.fn() } }
        }
    };
});

// Mock email module
vi.mock('../email', () => ({
    sendEmail: vi.fn().mockResolvedValue(true),
    generatePasswordResetEmail: vi.fn().mockReturnValue({ html: 'html', text: 'text' })
}));

// Mock storage
vi.mock('../storage', async () => {
    const actual = await vi.importActual('../storage');
    return {
        ...actual,
        storage: {
            findUserByEmail: vi.fn(),
            createPasswordResetToken: vi.fn(),
            getPasswordResetToken: vi.fn(),
            updateUserPassword: vi.fn(),
            markTokenAsUsed: vi.fn(),
            // Mock other required methods for routes
            listBusinesses: vi.fn(),
            getBusiness: vi.fn(),
            getUser: vi.fn(),
            getUserByEmail: vi.fn(),
        }
    };
});

// Mock auth middleware
vi.mock('../auth', () => ({
    setupAuth: vi.fn(),
    isAuthenticated: (req: any, res: any, next: any) => next()
}));

describe('Password Reset Routes', () => {
    let app: express.Express;
    let server: any;

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        server = createServer(app);
        await registerRoutes(server, app);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should return success message even if email not found (security)', async () => {
            vi.mocked(storage.findUserByEmail).mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('If that email exists');
            expect(storage.createPasswordResetToken).not.toHaveBeenCalled();
        });

        it('should create token and send email if user exists', async () => {
            vi.mocked(storage.findUserByEmail).mockResolvedValue({ id: '1', email: 'test@example.com' } as any);

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(200);
            expect(storage.createPasswordResetToken).toHaveBeenCalled();
        });

        it('should return 400 if email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/auth/verify-reset-token/:token', () => {
        it('should return valid: true for valid token', async () => {
            vi.mocked(storage.getPasswordResetToken).mockResolvedValue({
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000), // 1 hour future
                used: false
            } as any);

            const response = await request(app).get('/api/auth/verify-reset-token/valid-token');

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(true);
        });

        it('should return valid: false for expired token', async () => {
            vi.mocked(storage.getPasswordResetToken).mockResolvedValue({
                token: 'expired-token',
                expiresAt: new Date(Date.now() - 3600000), // 1 hour past
                used: false
            } as any);

            const response = await request(app).get('/api/auth/verify-reset-token/expired-token');

            expect(response.status).toBe(400);
            expect(response.body.valid).toBe(false);
        });

        it('should return valid: false for used token', async () => {
            vi.mocked(storage.getPasswordResetToken).mockResolvedValue({
                token: 'used-token',
                expiresAt: new Date(Date.now() + 3600000),
                used: true
            } as any);

            const response = await request(app).get('/api/auth/verify-reset-token/used-token');

            expect(response.status).toBe(400);
            expect(response.body.valid).toBe(false);
        });

        it('should return valid: false for non-existent token', async () => {
            vi.mocked(storage.getPasswordResetToken).mockResolvedValue(undefined);

            const response = await request(app).get('/api/auth/verify-reset-token/invalid');

            expect(response.status).toBe(400);
            expect(response.body.valid).toBe(false);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        it('should reset password successfully', async () => {
            vi.mocked(storage.getPasswordResetToken).mockResolvedValue({
                userId: '1',
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
                used: false
            } as any);

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'valid-token', newPassword: 'newpassword123' });

            expect(response.status).toBe(200);
            expect(storage.updateUserPassword).toHaveBeenCalledWith('1', expect.any(String));
            expect(storage.markTokenAsUsed).toHaveBeenCalledWith('valid-token');
        });

        it('should fail with short password', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'valid-token', newPassword: 'short' });

            expect(response.status).toBe(400);
            expect(storage.updateUserPassword).not.toHaveBeenCalled();
        });

        it('should fail with invalid token', async () => {
            vi.mocked(storage.getPasswordResetToken).mockResolvedValue(undefined);

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'invalid', newPassword: 'newpassword123' });

            expect(response.status).toBe(400);
        });
    });
});

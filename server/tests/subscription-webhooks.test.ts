// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock AI to prevent OpenAI initialization
vi.mock('../ai', () => ({
    analyzeCompetitors: vi.fn(),
}));

import request from 'supertest';
import express, { type Express } from 'express';
import { registerPaymentRoutes } from '../routes/payments';
import { storage } from '../storage';
import Stripe from 'stripe';

// Mock Stripe
const { mockConstructEvent, mockStripeInstance } = vi.hoisted(() => {
    const mockConstructEvent = vi.fn();
    return {
        mockConstructEvent,
        mockStripeInstance: {
            checkout: {
                sessions: {
                    create: vi.fn(),
                },
            },
            billingPortal: {
                sessions: {
                    create: vi.fn(),
                },
            },
            webhooks: {
                constructEvent: mockConstructEvent,
            },
        }
    };
});

vi.mock('stripe', () => {
    return {
        default: vi.fn(() => mockStripeInstance),
    };
});

describe('Subscription Webhook Tests', () => {
    let app: Express;
    let testUser: any;
    const webhookSecret = 'whsec_test_secret';

    beforeAll(async () => {
        // Set up test environment
        process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';

        // Create Express app
        app = express();
        app.use(express.json());
        app.use(express.raw({ type: 'application/json' }));

        // Mock authentication
        app.use((req, _res, next) => {
            req.user = testUser;
            next();
        });

        registerPaymentRoutes(app);

        // Create test user
        testUser = await storage.upsertUser({
            email: 'test@example.com',
            password: 'hashed_password',
            plan: 'free',
            stripeCustomerId: 'cus_test123'
        });
    });

    afterAll(async () => {
        // Clean up
        if (testUser?.id) {
            const users = await storage.listUsers();
            const user = users.find(u => u.id === testUser.id);
            if (user) {
                await storage.updateUser(user.id, { plan: 'free', subscriptionStatus: null });
            }
        }
    });

    beforeEach(async () => {
        // Reset user to free plan before each test
        if (testUser?.id) {
            await storage.updateUser(testUser.id, {
                plan: 'free',
                subscriptionStatus: null,
                subscriptionPeriodEnd: null,
                stripeSubscriptionId: null
            });
        }
    });

    describe('POST /api/webhook - checkout.session.completed', () => {
        it('should upgrade user to Pro when checkout succeeds', async () => {
            const event = {
                id: 'evt_test_123',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123',
                        customer: 'cus_test123',
                        subscription: 'sub_test_123',
                        client_reference_id: testUser.id,
                        payment_status: 'paid'
                    }
                }
            };

            // Mock Stripe webhook verification
            mockConstructEvent.mockReturnValue(event);

            const signature = 'test_signature';
            const response = await request(app)
                .post('/api/webhook')
                .set('stripe-signature', signature)
                .send(event);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ received: true });

            // Verify user was upgraded
            const updatedUser = await storage.getUser(testUser.id);
            expect(updatedUser?.plan).toBe('pro');
            expect(updatedUser?.subscriptionStatus).toBe('active');
            expect(updatedUser?.stripeCustomerId).toBe('cus_test123');
            expect(updatedUser?.stripeSubscriptionId).toBe('sub_test_123');
        });

        it('should return 400 if webhook signature is missing', async () => {
            const response = await request(app)
                .post('/api/webhook')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/webhook - customer.subscription.updated', () => {
        beforeEach(async () => {
            // Set user to Pro with active subscription
            await storage.updateUser(testUser.id, {
                plan: 'pro',
                subscriptionStatus: 'active',
                stripeSubscriptionId: 'sub_test_123'
            });
        });

        it('should update subscription status when subscription is canceled', async () => {
            const periodEnd = new Date('2026-03-01T00:00:00Z');
            const event = {
                id: 'evt_test_cancel',
                object: 'event',
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        id: 'sub_test_123',
                        customer: 'cus_test123',
                        status: 'canceled',
                        current_period_end: Math.floor(periodEnd.getTime() / 1000),
                        cancel_at_period_end: false,
                        canceled_at: Math.floor(Date.now() / 1000)
                    }
                }
            };

            mockConstructEvent.mockReturnValue(event);

            const signature = 'test_signature';
            const response = await request(app)
                .post('/api/webhook')
                .set('stripe-signature', signature)
                .send(event);

            expect(response.status).toBe(200);

            // Verify subscription was updated
            const updatedUser = await storage.getUser(testUser.id);
            expect(updatedUser?.subscriptionStatus).toBe('canceled');
            expect(updatedUser?.plan).toBe('free'); // Downgraded immediately on cancellation status
            expect(updatedUser?.subscriptionPeriodEnd).toBeDefined();
        });

        it('should reactivate subscription when cancel_at_period_end is removed', async () => {
            // First set as canceled
            await storage.updateUser(testUser.id, {
                subscriptionStatus: 'canceled',
                subscriptionPeriodEnd: new Date('2026-03-01')
            });

            const event = {
                id: 'evt_test_reactivate',
                object: 'event',
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        id: 'sub_test_123',
                        customer: 'cus_test123',
                        status: 'active',
                        current_period_end: Math.floor(new Date('2026-03-01').getTime() / 1000),
                        cancel_at_period_end: false,
                        canceled_at: null
                    }
                }
            };

            mockConstructEvent.mockReturnValue(event);

            const signature = 'test_signature';
            const response = await request(app)
                .post('/api/webhook')
                .set('stripe-signature', signature)
                .send(event);

            expect(response.status).toBe(200);

            // Verify subscription was reactivated
            const updatedUser = await storage.getUser(testUser.id);
            expect(updatedUser?.subscriptionStatus).toBe('active');
            expect(updatedUser?.plan).toBe('pro');
        });

        it('should downgrade to free when subscription becomes past_due', async () => {
            const event = {
                id: 'evt_test_past_due',
                object: 'event',
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        id: 'sub_test_123',
                        customer: 'cus_test123',
                        status: 'past_due',
                        current_period_end: Math.floor(new Date('2026-02-01').getTime() / 1000)
                    }
                }
            };

            mockConstructEvent.mockReturnValue(event);

            const signature = 'test_signature';
            const response = await request(app)
                .post('/api/webhook')
                .set('stripe-signature', signature)
                .send(event);

            expect(response.status).toBe(200);

            // Verify user was downgraded
            const updatedUser = await storage.getUser(testUser.id);
            expect(updatedUser?.subscriptionStatus).toBe('past_due');
            expect(updatedUser?.plan).toBe('free'); // Should be downgraded
        });
    });

    describe('POST /api/webhook - customer.subscription.deleted', () => {
        beforeEach(async () => {
            await storage.updateUser(testUser.id, {
                plan: 'pro',
                subscriptionStatus: 'active',
                stripeSubscriptionId: 'sub_test_123'
            });
        });

        it('should downgrade user to free when subscription is deleted', async () => {
            const event = {
                id: 'evt_test_deleted',
                object: 'event',
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: 'sub_test_123',
                        customer: 'cus_test123',
                        status: 'canceled'
                    }
                }
            };

            mockConstructEvent.mockReturnValue(event);

            const signature = 'test_signature';
            const response = await request(app)
                .post('/api/webhook')
                .set('stripe-signature', signature)
                .send(event);

            expect(response.status).toBe(200);

            // Verify user was downgraded
            const updatedUser = await storage.getUser(testUser.id);
            expect(updatedUser?.plan).toBe('free');
            expect(updatedUser?.subscriptionStatus).toBe('canceled');
        });
    });

    describe('Webhook Security', () => {
        it('should reject webhook with invalid signature', async () => {
            mockConstructEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const response = await request(app)
                .post('/api/webhook')
                .set('stripe-signature', 'invalid_signature')
                .send({ type: 'test.event' });

            expect(response.status).toBe(400);
        });
    });
});

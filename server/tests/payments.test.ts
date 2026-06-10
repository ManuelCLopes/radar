// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from "vitest";

// Mock AI to prevent OpenAI initialization
vi.mock("../ai", () => ({
    analyzeCompetitors: vi.fn(),
}));

import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import Stripe from "stripe";

// Mock Stripe
const { mockStripeInstance } = vi.hoisted(() => ({
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
            constructEvent: vi.fn(),
        },
    }
}));

vi.mock("stripe", () => {
    return {
        default: class MockStripe {
            checkout = mockStripeInstance.checkout;
            billingPortal = mockStripeInstance.billingPortal;
            webhooks = mockStripeInstance.webhooks;
        },
    };
});

// Mock Storage
vi.mock("../storage", () => ({
    storage: {
        getUser: vi.fn(),
        getUserByUsername: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn(),
        getUserByStripeCustomerId: vi.fn(),
        createBillingWaitlistLead: vi.fn(),
        sessionStore: {
            get: vi.fn(),
            set: vi.fn(),
            destroy: vi.fn(),
        },
    },
}));

// Mock Passport
vi.mock("passport", () => ({
    default: {
        initialize: () => (req: any, res: any, next: any) => {
            req.isAuthenticated = () => !!req.user;
            next();
        },
        session: () => (req: any, res: any, next: any) => next(),
        use: vi.fn(),
        serializeUser: vi.fn(),
        deserializeUser: vi.fn(),
        authenticate: () => (req: any, res: any, next: any) => next(),
    },
}));

describe("Payments API", () => {
    let app: express.Express;
    let server: any;
    let mockStripe: any;

    beforeAll(async () => {
        // Setup environment variables
        process.env.STRIPE_SECRET_KEY = "test_secret_key";
        process.env.STRIPE_WEBHOOK_SECRET = "test_webhook_secret";
        process.env.STRIPE_PRO_PRICE_ID = "price_pro_test";
        process.env.BILLING_MODE = "live";

        app = express();

        // Replicate Middleware from server/index.ts to populate req.rawBody
        app.use(
            express.json({
                verify: (req: any, _res, buf) => {
                    req.rawBody = buf;
                },
            })
        );
        app.use(express.urlencoded({ extended: false }));

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;

        // Get the mock instance by instantiating (returns the same singleton mock object)
        mockStripe = new Stripe("test_key", {} as any) as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
        process.env.BILLING_MODE = "live";
        process.env.STRIPE_PRO_PRICE_ID = "price_pro_test";
        delete process.env.STRIPE_AGENCY_PRICE_ID;
    });

    describe("POST /api/create-checkout-session", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app).post("/api/create-checkout-session");
            expect(res.status).toBe(401);
        });

        it("should create a checkout session for authenticated user", async () => {
            const mockUser = { id: "1", email: "test@example.com" };
            const mockSession = { url: "https://stripe.com/checkout" };
            mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

            // Create a specific app instance for this test to inject user
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req: any, res, next) => {
                req.user = mockUser;
                next();
            });
            await registerRoutes(createServer(testApp), testApp);

            const res = await request(testApp).post("/api/create-checkout-session");
            expect(res.status).toBe(200);
            expect(res.body.url).toBe(mockSession.url);
            expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
                customer_email: mockUser.email,
                client_reference_id: mockUser.id,
                mode: "subscription",
                line_items: [
                    expect.objectContaining({
                        price: "price_pro_test",
                    }),
                ],
            }));
        });

        it("should create an agency checkout session with the agency price", async () => {
            process.env.STRIPE_AGENCY_PRICE_ID = "price_agency_test";

            const mockUser = { id: "1", email: "agency@example.com" };
            const mockSession = { url: "https://stripe.com/checkout/agency" };
            mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req: any, res, next) => {
                req.user = mockUser;
                next();
            });
            await registerRoutes(createServer(testApp), testApp);

            const res = await request(testApp)
                .post("/api/create-checkout-session")
                .send({ plan: "agency" });

            expect(res.status).toBe(200);
            expect(res.body.url).toBe(mockSession.url);
            expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
                line_items: [
                    expect.objectContaining({
                        price: "price_agency_test",
                    }),
                ],
                metadata: expect.objectContaining({
                    plan: "agency",
                }),
            }));

        });

        it("should block checkout when billing is in waitlist mode", async () => {
            process.env.BILLING_MODE = "waitlist";

            const mockUser = { id: "1", email: "test@example.com" };
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req: any, res, next) => {
                req.user = mockUser;
                next();
            });
            await registerRoutes(createServer(testApp), testApp);

            const res = await request(testApp).post("/api/create-checkout-session");

            expect(res.status).toBe(403);
            expect(res.body.code).toBe("BILLING_WAITLIST_MODE");
            expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
        });

        it("should return configuration error when agency price is missing in live mode", async () => {
            const mockUser = { id: "1", email: "agency@example.com" };
            const testApp = express();
            testApp.use(express.json());
            testApp.use((req: any, res, next) => {
                req.user = mockUser;
                next();
            });
            await registerRoutes(createServer(testApp), testApp);

            const res = await request(testApp)
                .post("/api/create-checkout-session")
                .send({ plan: "agency" });

            expect(res.status).toBe(503);
            expect(res.body.code).toBe("STRIPE_PRICE_NOT_CONFIGURED");
            expect(res.body.plan).toBe("agency");
            expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
        });
    });

    describe("POST /api/billing-waitlist", () => {
        it("should capture a billing waitlist lead", async () => {
            vi.spyOn(storage, "createBillingWaitlistLead").mockResolvedValue({
                id: "lead_1",
                userId: null,
                email: "lead@example.com",
                plan: "agency",
                message: "Interested in client reporting",
                source: "pricing_modal",
                createdAt: new Date(),
            } as any);

            const res = await request(app)
                .post("/api/billing-waitlist")
                .send({
                    email: "lead@example.com",
                    plan: "agency",
                    message: "Interested in client reporting",
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(storage.createBillingWaitlistLead).toHaveBeenCalledWith(expect.objectContaining({
                email: "lead@example.com",
                plan: "agency",
                message: "Interested in client reporting",
            }));
        });
    });

    describe("POST /api/create-portal-session", () => {
        it("should return 400 if user has no stripeCustomerId", async () => {
            const mockUser = { id: "1", email: "test@example.com", stripeCustomerId: null };

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req: any, res, next) => {
                req.user = mockUser;
                next();
            });
            await registerRoutes(createServer(testApp), testApp);

            const res = await request(testApp).post("/api/create-portal-session");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("No subscription found");
        });

        it("should create a portal session for user with stripeCustomerId", async () => {
            const mockUser = { id: "1", email: "test@example.com", stripeCustomerId: "cus_123" };
            const mockSession = { url: "https://stripe.com/portal" };
            mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession);

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req: any, res, next) => {
                req.user = mockUser;
                next();
            });
            await registerRoutes(createServer(testApp), testApp);

            const res = await request(testApp).post("/api/create-portal-session");
            expect(res.status).toBe(200);
            expect(res.body.url).toBe(mockSession.url);
            expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
                customer: "cus_123",
            }));
        });
    });

    describe("POST /api/webhook", () => {
        it("should define rawBody on request", async () => {
            // This test confirms our middleware setup works as expected
            let rawBodyCaptured: any;
            const testApp = express();
            testApp.use(express.json({
                verify: (req: any, _res, buf) => {
                    req.rawBody = buf;
                }
            }));
            testApp.post("/test-raw", (req: any, res) => {
                rawBodyCaptured = req.rawBody;
                res.sendStatus(200);
            });

            await request(testApp)
                .post("/test-raw")
                .send({ foo: "bar" });

            expect(rawBodyCaptured).toBeDefined();
            expect(Buffer.isBuffer(rawBodyCaptured)).toBe(true);
        });

        it("should return 400 if signature is missing", async () => {
            const res = await request(app)
                .post("/api/webhook")
                .send({ some: "data" });

            expect(res.status).toBe(400);
        });

        it("should process checkout.session.completed event", async () => {
            const event = {
                type: "checkout.session.completed",
                data: {
                    object: {
                        client_reference_id: "1",
                        subscription: "sub_123",
                        customer: "cus_123",
                    },
                },
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(event);

            const res = await request(app)
                .post("/api/webhook")
                .set("stripe-signature", "valid_signature")
                .send(event);

            expect(res.status).toBe(200);
            expect(storage.updateUser).toHaveBeenCalledWith("1", expect.objectContaining({
                stripeCustomerId: "cus_123",
                stripeSubscriptionId: "sub_123",
                subscriptionStatus: "active",
                plan: "pro"
            }));
        });

        it("should process customer.subscription.updated event", async () => {
            const event = {
                type: "customer.subscription.updated",
                data: {
                    object: {
                        customer: "cus_123",
                        status: "active",
                        current_period_end: 1735689600
                    },
                },
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(event);
            vi.spyOn(storage, 'getUserByStripeCustomerId').mockResolvedValue({ id: "1" } as any);

            const res = await request(app)
                .post("/api/webhook")
                .set("stripe-signature", "valid_signature")
                .send(event);

            expect(res.status).toBe(200);
            expect(storage.getUserByStripeCustomerId).toHaveBeenCalledWith("cus_123");
            expect(storage.updateUser).toHaveBeenCalledWith("1", expect.objectContaining({
                subscriptionStatus: "active",
                plan: "pro"
            }));
        });

        it("should process customer.subscription.deleted event", async () => {
            const event = {
                type: "customer.subscription.deleted",
                data: {
                    object: {
                        customer: "cus_123",
                    },
                },
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(event);
            vi.spyOn(storage, 'getUserByStripeCustomerId').mockResolvedValue({ id: "1" } as any);

            const res = await request(app)
                .post("/api/webhook")
                .set("stripe-signature", "valid_signature")
                .send(event);

            expect(res.status).toBe(200);
            expect(storage.updateUser).toHaveBeenCalledWith("1", expect.objectContaining({
                subscriptionStatus: "canceled",
                plan: "free"
            }));
        });

        it("should return 400 if signature verification fails", async () => {
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error("Invalid signature");
            });

            const res = await request(app)
                .post("/api/webhook")
                .set("stripe-signature", "invalid_signature")
                .send({});

            expect(res.status).toBe(400);
        });
    });
});

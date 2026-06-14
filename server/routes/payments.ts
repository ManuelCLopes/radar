import express, { type Express, type Request } from "express";
import Stripe from "stripe";
import { storage } from "../storage.js";
import { log } from "../log.js";
import { insertBillingWaitlistLeadSchema, type User } from "../../shared/schema.js";

if (!process.env.STRIPE_SECRET_KEY) {
    log("STRIPE_SECRET_KEY is not set. Payment routes will not handle real requests.", "stripe");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key", {
    // apiVersion: "2024-12-18", // Removed to avoid type conflicts
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getBillingMode() {
    return process.env.BILLING_MODE === "live" ? "live" : "waitlist";
}

function normalizePaidPlan(plan: unknown) {
    return plan === "agency" ? "agency" : "pro";
}

function getPriceIdForPlan(plan: "pro" | "agency") {
    if (plan === "agency") {
        return process.env.STRIPE_AGENCY_PRICE_ID;
    }

    return process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRICE_ID;
}

export function registerPaymentRoutes(app: Express) {
    // Check Stripe Configuration Status
    app.get("/api/stripe-config-status", (req, res) => {
        const configured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
        res.json({
            configured,
            billingMode: getBillingMode(),
            plans: {
                pro: !!getPriceIdForPlan("pro"),
                agency: !!getPriceIdForPlan("agency"),
            },
        });
    });

    app.post("/api/billing-waitlist", async (req, res) => {
        const user = req.user as User | undefined;
        const parsedLead = insertBillingWaitlistLeadSchema.safeParse({
            email: req.body?.email || user?.email,
            plan: normalizePaidPlan(req.body?.plan),
            message: req.body?.message,
            source: "pricing_modal",
            userId: user?.id || null,
        });

        if (!parsedLead.success) {
            return res.status(400).json({
                error: "Invalid waitlist request",
                details: parsedLead.error.flatten(),
            });
        }

        try {
            const existingLead = await storage.getBillingWaitlistLead(parsedLead.data.email, parsedLead.data.plan);
            if (existingLead) {
                return res.status(200).json({ success: true, alreadyJoined: true });
            }

            const lead = await storage.createBillingWaitlistLead(parsedLead.data);
            log(`Billing waitlist lead captured for ${lead.email} (${lead.plan})`, "billing");
            res.status(201).json({ success: true, alreadyJoined: false });
        } catch (error: any) {
            if (error?.code === "23505") {
                return res.status(200).json({ success: true, alreadyJoined: true });
            }

            log(`Error capturing billing waitlist lead: ${error.message}`, "billing");
            res.status(500).json({ error: "Failed to join waitlist" });
        }
    });

    // Create Checkout Session
    app.post("/api/create-checkout-session", async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (getBillingMode() !== "live") {
            return res.status(403).json({
                error: "Billing is currently in early access mode",
                code: "BILLING_WAITLIST_MODE",
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(503).json({
                error: "Stripe is not configured",
                code: "STRIPE_NOT_CONFIGURED",
            });
        }

        const user = req.user as User;
        const plan = normalizePaidPlan(req.body?.plan);
        const price = getPriceIdForPlan(plan);

        if (!price) {
            return res.status(503).json({
                error: `Stripe price is not configured for ${plan}`,
                code: "STRIPE_PRICE_NOT_CONFIGURED",
                plan,
            });
        }

        try {
            const session = await stripe.checkout.sessions.create({
                customer_email: user.email,
                client_reference_id: user.id,
                line_items: [
                    {
                        price,
                        quantity: 1,
                    },
                ],
                mode: "subscription",
                success_url: `${req.protocol}://${req.get("host")}/settings?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.protocol}://${req.get("host")}/settings`,
                automatic_tax: { enabled: true },
                metadata: {
                    userId: user.id,
                    plan
                }
            });

            res.json({ url: session.url });
        } catch (error: any) {
            log(`Error creating checkout session: ${error.message}`, "stripe");
            res.status(500).json({ message: "Failed to create checkout session" });
        }
    });

    // Create Portal Session
    app.post("/api/create-portal-session", async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = req.user as User;

        if (!user.stripeCustomerId) {
            return res.status(400).json({ message: "No subscription found" });
        }

        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: `${req.protocol}://${req.get("host")}/settings`,
            });

            res.json({ url: session.url });
        } catch (error: any) {
            log(`Error creating portal session: ${error.message}`, "stripe");
            res.status(500).json({ message: "Failed to create portal session" });
        }
    });

    // Webhook Handler
    app.post("/api/webhook", async (req: Request, res) => {
        const signature = req.headers["stripe-signature"];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret || !signature) {
            log("Missing webhook secret or signature", "stripe");
            return res.sendStatus(400);
        }

        let event: Stripe.Event;

        try {
            // req.rawBody must be available (set in index.ts)
            event = stripe.webhooks.constructEvent(
                req.rawBody as Buffer,
                signature as string,
                webhookSecret
            );
        } catch (err: any) {
            log(`Webhook signature verification failed: ${err.message}`, "stripe");
            return res.sendStatus(400);
        }

        // Handle the event
        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.client_reference_id || session.metadata?.userId;
                    const subscriptionId = session.subscription as string;
                    const customerId = session.customer as string;
                    const plan = normalizePaidPlan(session.metadata?.plan);

                    if (userId) {
                        await storage.updateUser(userId, {
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            subscriptionStatus: "active",
                            plan
                        });
                        log(`User ${userId} upgraded to ${plan}`, "stripe");
                    }
                    break;
                }
                case "customer.subscription.updated": {
                    const subscription = event.data.object as any; // Cast to any to avoid type issues with snake_case properties
                    const customerId = subscription.customer as string;
                    const status = subscription.status;

                    const user = await storage.getUserByStripeCustomerId(customerId);
                    if (user) {
                        const plan = status === 'active'
                            ? normalizePaidPlan(subscription.metadata?.plan || user.plan)
                            : 'free';

                        await storage.updateUser(user.id, {
                            subscriptionStatus: status,
                            subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
                            plan
                        });
                        log(`Updated subscription for user ${user.id} to ${status}`, "stripe");
                    }
                    break;
                }
                case "customer.subscription.deleted": {
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;

                    const user = await storage.getUserByStripeCustomerId(customerId);
                    if (user) {
                        await storage.updateUser(user.id, {
                            subscriptionStatus: "canceled",
                            plan: "free",
                            subscriptionPeriodEnd: null
                        });
                        log(`Subscription deleted for user ${user.id}`, "stripe");
                    }
                    break;
                }
            }
        } catch (error: any) {
            log(`Error processing webhook: ${error.message}`, "stripe");
            return res.sendStatus(500);
        }

        res.json({ received: true });
    });
}

import express, { type Express, type Request } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { log } from "../log";
import { User } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
    log("STRIPE_SECRET_KEY is not set. Payment routes will not handle real requests.", "stripe");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key", {
    // apiVersion: "2024-12-18", // Removed to avoid type conflicts
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export function registerPaymentRoutes(app: Express) {
    // Create Checkout Session
    app.post("/api/create-checkout-session", async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = req.user as User;

        try {
            const session = await stripe.checkout.sessions.create({
                customer_email: user.email,
                client_reference_id: user.id,
                line_items: [
                    {
                        // Replace with your actual Price ID from Stripe Dashboard
                        // For now we use a placeholder or expect it in env
                        price: process.env.STRIPE_PRICE_ID || "price_H5ggYwtDq4fbrJ",
                        quantity: 1,
                    },
                ],
                mode: "subscription",
                success_url: `${req.protocol}://${req.get("host")}/settings?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.protocol}://${req.get("host")}/settings`,
                automatic_tax: { enabled: true },
                metadata: {
                    userId: user.id
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
    app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req: Request, res) => {
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

                    if (userId) {
                        await storage.updateUser(userId, {
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            subscriptionStatus: "active",
                            plan: "pro"
                        });
                        log(`User ${userId} upgraded to Pro`, "stripe");
                    }
                    break;
                }
                case "customer.subscription.updated": {
                    const subscription = event.data.object as any; // Cast to any to avoid type issues with snake_case properties
                    const customerId = subscription.customer as string;
                    const status = subscription.status;

                    const user = await storage.getUserByStripeCustomerId(customerId);
                    if (user) {
                        await storage.updateUser(user.id, {
                            subscriptionStatus: status,
                            subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
                            plan: status === 'active' ? 'pro' : 'free' // Downgrade if not active
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

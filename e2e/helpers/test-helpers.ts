import { storage } from '../../server/storage';
import type { User } from '@db/schema';

/**
 * Helper to create a test user
 */
export async function createUser(email: string, password: string): Promise<User> {
    // Check if user exists and delete
    await deleteUserByEmail(email);

    const user = await storage.upsertUser({
        email,
        password, // In real scenario this would be hashed
        plan: 'free',
        isVerified: true
    });

    return user;
}

/**
 * Helper to delete user by email
 */
export async function deleteUserByEmail(email: string): Promise<void> {
    try {
        const user = await storage.findUserByEmail(email);
        if (user) {
            // Note: Implement user deletion if not available in storage
            // For now we just update to free plan
            await storage.updateUser(user.id, {
                plan: 'free',
                subscriptionStatus: null,
                stripeCustomerId: null,
                stripeSubscriptionId: null
            });
        }
    } catch (error) {
        // User doesn't exist, that's fine
    }
}

/**
 * Helper to upgrade user to Pro
 */
export async function upgradeToPro(email: string): Promise<void> {
    const user = await storage.findUserByEmail(email);
    if (!user) {
        throw new Error(`User not found: ${email}`);
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await storage.updateUser(user.id, {
        plan: 'pro',
        subscriptionStatus: 'active',
        stripeCustomerId: `cus_test_${user.id}`,
        stripeSubscriptionId: `sub_test_${user.id}`,
        subscriptionPeriodEnd: periodEnd
    });
}

/**
 * Helper to cancel user subscription
 */
export async function cancelSubscription(email: string): Promise<void> {
    const user = await storage.findUserByEmail(email);
    if (!user) {
        throw new Error(`User not found: ${email}`);
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await storage.updateUser(user.id, {
        subscriptionStatus: 'canceled',
        subscriptionPeriodEnd: periodEnd
    });
}

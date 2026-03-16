import rateLimit from "express-rate-limit";
import type { Request } from "express";

export const getRateLimitMax = (req: Request | any) => {
    const user = req.user as any;

    if (!user) {
        // Guest: 50 requests per hour
        return 50;
    }

    if (user.plan === "professional") {
        // Pro: 1000 requests per hour
        return 1000;
    }

    // Free User: 200 requests per hour
    return 200;
};

export const getClientIdentifier = (req: Request) => {
    const user = req.user as any;
    if (user?.id) {
        return `user:${user.id}`;
    }

    const clientIp = req.ip || req.socket?.remoteAddress || "unknown-ip";

    return `ip:${clientIp}`;
};

export const searchRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: getRateLimitMax,
    keyGenerator: getClientIdentifier,
    message: {
        error: "Rate limit exceeded",
        message: "Too many searches. Please upgrade your plan for higher limits."
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false
});

const createLimiter = (windowMs: number, max: number, message: string) =>
    rateLimit({
        windowMs,
        max,
        keyGenerator: getClientIdentifier,
        message: {
            error: "Rate limit exceeded",
            message,
        },
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
    });

export const createLoginRateLimiter = () =>
    createLimiter(15 * 60 * 1000, 10, "Too many login attempts. Please try again in 15 minutes.");

export const createRegistrationRateLimiter = () =>
    createLimiter(60 * 60 * 1000, 5, "Too many registration attempts. Please try again later.");

export const createPasswordResetRequestRateLimiter = () =>
    createLimiter(60 * 60 * 1000, 5, "Too many password reset requests. Please try again later.");

export const createPasswordResetConfirmRateLimiter = () =>
    createLimiter(30 * 60 * 1000, 10, "Too many password reset attempts. Please try again later.");

export const createVerificationEmailRateLimiter = () =>
    createLimiter(60 * 60 * 1000, 5, "Too many verification email requests. Please try again later.");

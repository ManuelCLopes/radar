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

export const searchRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: getRateLimitMax,
    keyGenerator: (req: Request) => {
        // Limit authenticated users by ID, guests by IP
        const user = req.user as any;
        if (user) return user.id;

        // Use forwarded IP (behind reverse proxy), direct IP, or socket address
        const forwarded = req.headers["x-forwarded-for"];
        const clientIp = typeof forwarded === "string"
            ? forwarded.split(",")[0].trim()
            : req.ip || req.socket?.remoteAddress || "unknown-ip";
        return clientIp;
    },
    message: {
        error: "Rate limit exceeded",
        message: "Too many searches. Please upgrade your plan for higher limits."
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false
});

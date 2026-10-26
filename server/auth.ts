import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";
import type { User } from "../shared/schema.js";
import { getAppBaseUrl, getGoogleCallbackUrl } from "./urls.js";
import {
    createLoginRateLimiter,
    createRegistrationRateLimiter,
    createVerificationEmailRateLimiter,
} from "./middleware/rate-limit.js";
import { isProductionEnvironment } from "./runtime-config.js";
import { toSafeUser } from "./safeUser.js";
import { runInBackground } from "./background.js";

import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, SUPPORTED_LANGUAGES } from "./accountRules.js";

const SALT_ROUNDS = 10;

export async function verifyLocal(email: string, password: string, done: (err: any, user?: any, info?: any) => void) {
    try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
            return done(null, false, { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } as any);
        }

        if (!user.passwordHash) {
            return done(null, false, { message: "Please use Google login for this account", code: "GOOGLE_LOGIN_REQUIRED" } as any);
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return done(null, false, { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } as any);
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}

export async function verifyGoogle(accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error("No email found in Google profile"));
        }

        let user = await storage.getUserByEmail(email);

        if (!user) {
            // Create new user
            user = await storage.upsertUser({
                email,
                provider: "google",
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                profileImageUrl: profile.photos?.[0]?.value || null,
                // Google has already verified this address.
                isVerified: true,
            });
        } else {
            // Update existing user
            user = await storage.upsertUser({
                id: user.id,
                email: user.email,
                provider: "google",
                firstName: profile.name?.givenName || user.firstName,
                lastName: profile.name?.familyName || user.lastName,
                profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
            });
        }

        return done(null, user);
    } catch (error) {
        return done(error as Error);
    }
}

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const databaseUrl = process.env.DATABASE_URL?.trim();

    let store;
    if (databaseUrl) {
        const pgStore = connectPg(session);
        store = new pgStore({
            conString: databaseUrl,
            createTableIfMissing: false,
            ttl: sessionTtl,
            tableName: "sessions",
        });
    } else {
        if (isProductionEnvironment()) {
            throw new Error("DATABASE_URL must be set in production. MemoryStore is not allowed.");
        }
        store = new session.MemoryStore();
    }

    return session({
        secret: (() => {
            const secret = process.env.SESSION_SECRET?.trim();
            if (!secret && isProductionEnvironment()) {
                throw new Error("SESSION_SECRET must be set in production");
            }
            return secret || "local-dev-secret";
        })(),
        store: store,
        proxy: isProductionEnvironment(),
        resave: false,
        saveUninitialized: false,
        name: process.env.SESSION_COOKIE_NAME?.trim() || "competitor_watcher.sid",
        cookie: {
            httpOnly: true,
            secure: isProductionEnvironment(),
            sameSite: "lax",
            maxAge: sessionTtl,
        },
    });
}

const getSessionCookieName = () =>
    process.env.SESSION_COOKIE_NAME?.trim() || "competitor_watcher.sid";

export async function setupAuth(app: Express) {
    const loginRateLimiter = createLoginRateLimiter();
    const registrationRateLimiter = createRegistrationRateLimiter();
    const verificationEmailRateLimiter = createVerificationEmailRateLimiter();

    // trust proxy is set to 1 hop in bootstrap. Trusting every hop would let
    // clients spoof X-Forwarded-For and dodge the IP-based rate limiters.
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Serialize/deserialize user
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });



    // Local Strategy (Email/Password)
    passport.use(
        new LocalStrategy(
            { usernameField: "email" },
            verifyLocal
        )
    );

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const callbackURL = getGoogleCallbackUrl();
        console.log(`[Auth] Google OAuth configured with callback: ${callbackURL}`);

        if (process.env.NODE_ENV === "production") {
            if (callbackURL.includes("localhost") || callbackURL.includes("127.0.0.1")) {
                console.warn("\x1b[33m%s\x1b[0m", `[WARNING] Google Callback URL (${callbackURL}) appears to be a local address but environment is production. Redirection will fail on the live site!`);
            }
        }



        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: callbackURL,
                },
                verifyGoogle
            )
        );
    }

    // Routes
    // Local login
    app.post("/api/login", loginRateLimiter, (req, res, next) => {
        passport.authenticate("local", (err: any, user: any, info: any) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({
                    message: info?.message || "Invalid email or password",
                    code: info?.code || "INVALID_CREDENTIALS"
                });
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.json({ user: toSafeUser(user) });
            });
        })(req, res, next);
    });

    // Local registration
    app.post("/api/register", registrationRateLimiter, async (req, res) => {
        try {
            // plan is deliberately not read from the body: paid plans are only
            // granted by the Stripe webhook.
            const { password, firstName, lastName, language } = req.body;
            const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

            if (!email || typeof password !== "string" || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            if (!EMAIL_PATTERN.test(email)) {
                return res.status(400).json({ message: "Invalid email format" });
            }

            if (password.length < MIN_PASSWORD_LENGTH) {
                return res.status(400).json({ message: "Password must be at least 8 characters long" });
            }

            // Check if user already exists
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: "Email already registered" });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // Generate verification token
            const crypto = await import("crypto");
            const verificationToken = crypto.randomBytes(32).toString("hex");
            const verificationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            // Create user
            const user = await storage.upsertUser({
                email,
                passwordHash,
                provider: "local",
                firstName: firstName || null,
                lastName: lastName || null,
                plan: "free",
                language: SUPPORTED_LANGUAGES.includes(language) ? language : "pt",
                isVerified: false,
                verificationToken,
                verificationTokenExpiresAt
            });

            // Send the verification email without delaying the response.
            const verificationLink = `${getAppBaseUrl(req)}/verify-email?token=${verificationToken}`;
            runInBackground(
                import("./email.js").then(({ emailService }) =>
                    emailService.sendVerificationEmail(email, verificationLink, user.language || "pt")),
                "Registration verification email",
            );

            // Log in the user
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: "Registration successful but login failed" });
                }
                res.json({ user: toSafeUser(user) });
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "Registration failed" });
        }
    });

    // Verification Routes
    app.post("/api/auth/verify-email", async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: "Token is required" });
            }

            const user = await storage.findUserByVerificationToken(token);
            if (!user) {
                return res.status(400).json({ error: "Invalid token" });
            }

            if (user.isVerified) {
                return res.status(400).json({ error: "Email already verified" });
            }

            if (user.verificationTokenExpiresAt && new Date() > user.verificationTokenExpiresAt) {
                return res.status(400).json({ error: "Token expired" });
            }

            await storage.verifyUser(user.id);
            res.json({ message: "Email verified successfully" });
        } catch (error) {
            console.error("Verification error:", error);
            res.status(500).json({ error: "Verification failed" });
        }
    });

    app.post("/api/auth/resend-verification", verificationEmailRateLimiter, async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        try {
            const user = req.user as User;
            if (user.isVerified) {
                return res.status(400).json({ error: "Email already verified" });
            }

            const crypto = await import("crypto");
            const verificationToken = crypto.randomBytes(32).toString("hex");
            const verificationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await storage.updateUser(user.id, {
                verificationToken,
                verificationTokenExpiresAt
            });

            const { emailService } = await import("./email.js");
            const userLang = user.language || "pt";
            const verificationLink = `${getAppBaseUrl(req)}/verify-email?token=${verificationToken}`;

            await emailService.sendVerificationEmail(user.email, verificationLink, userLang);

            res.json({ message: "Verification email sent" });
        } catch (error) {
            console.error("Resend verification error:", error);
            res.status(500).json({ error: "Failed to resend verification email" });
        }
    });



    // Google OAuth routes
    app.get(
        "/api/auth/google",
        (req, res, next) => {
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                return res.status(400).json({
                    message: "Google OAuth is not configured. Please use email/password authentication or contact the administrator to set up Google OAuth."
                });
            }
            next();
        },
        (req, res, next) =>
            passport.authenticate("google", {
                scope: ["profile", "email"],
                callbackURL: getGoogleCallbackUrl(req),
            } as any)(req, res, next)
    );

    app.get(
        "/api/auth/google/callback",
        (req, res, next) => {
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                return res.redirect("/login?error=google_not_configured");
            }
            next();
        },
        (req, res, next) =>
            passport.authenticate("google", {
                failureRedirect: "/login",
                callbackURL: getGoogleCallbackUrl(req),
            } as any)(req, res, next),
        (req, res) => {
            res.redirect("/dashboard");
        }
    );

    // Logout
    // Logout - Handle both paths to be safe
    const logoutHandler = (req: any, res: any, next: any) => {
        console.log(`[Logout] Attempting logout for user: ${req.user ? (req.user as any).id : 'unknown'}`);

        // Clear site data header to force browser to wipe cookies and storage
        res.setHeader("Clear-Site-Data", '"cookies", "storage"');

        req.logout((err: any) => {
            if (err) {
                console.error("[Logout] Passport logout error:", err);
                return next(err);
            }

            req.session.destroy((err: any) => {
                if (err) {
                    console.error("[Logout] Session destroy error:", err);
                    return next(err);
                }
                console.log(`[Logout] Session destroyed successfully`);

                const sessionCookieName = getSessionCookieName();
                res.clearCookie(sessionCookieName, { path: '/' });
                if (sessionCookieName !== "connect.sid") {
                    res.clearCookie("connect.sid", { path: '/' });
                }
                res.json({ success: true, message: "Logged out successfully" });
            });
        });
    };

    app.post("/api/auth/logout", logoutHandler);
    app.post("/api/logout", logoutHandler); // Alias

    // Get current user
    app.get("/api/auth/user", (req, res) => {
        // Prevent caching of user state
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
        res.header("ETag", "false"); // Disable ETag to prevent 304

        if (req.isAuthenticated()) {
            // Sanitize: strip sensitive fields before sending to client
            res.json({ user: toSafeUser(req.user as User) });
        } else {
            res.status(401).json({ message: "Not authenticated" });
        }
    });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
};

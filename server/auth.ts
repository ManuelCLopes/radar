import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const SALT_ROUNDS = 10;

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

    let store;
    if (process.env.DATABASE_URL) {
        const pgStore = connectPg(session);
        store = new pgStore({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: false,
            ttl: sessionTtl,
            tableName: "sessions",
        });
    } else {
        store = new session.MemoryStore();
    }

    return session({
        secret: process.env.SESSION_SECRET || "local-dev-secret",
        store: store,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtl,
        },
    });
}

export async function setupAuth(app: Express) {
    app.set("trust proxy", true);
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
            async (email, password, done) => {
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
        )
    );

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";
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
                async (accessToken, refreshToken, profile, done) => {
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
            )
        );
    }

    // Routes
    // Local login
    app.post("/api/login", (req, res, next) => {
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
                return res.json({ user });
            });
        })(req, res, next);
    });

    // Local registration
    app.post("/api/register", async (req, res) => {
        try {
            const { password, firstName, lastName, plan, language } = req.body;
            const email = req.body.email?.toLowerCase();

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            // Check if user already exists
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: "Email already registered" });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // Create user
            const user = await storage.upsertUser({
                email,
                passwordHash,
                provider: "local",
                firstName: firstName || null,
                lastName: lastName || null,
                plan: plan || "free",
                language: language || "pt",
            });

            // Send welcome email (async, don't block registration)
            (async () => {
                try {
                    const { sendEmail, generateWelcomeEmail } = await import("./email");
                    const userLang = user.language || "pt";
                    const { html, text } = generateWelcomeEmail(firstName || email, userLang);

                    const subjects: Record<string, string> = {
                        pt: "Bem-vindo ao Competitor Watcher! 🎉",
                        en: "Welcome to Competitor Watcher! 🎉",
                        es: "¡Bienvenido a Competitor Watcher! 🎉",
                        fr: "Bienvenue sur Competitor Watcher ! 🎉",
                        de: "Willkommen bei Competitor Watcher! 🎉"
                    };

                    await sendEmail({
                        to: email,
                        subject: subjects[userLang] || subjects.en,
                        html,
                        text,
                    });
                } catch (error) {
                    console.error("[Registration] Failed to send welcome email:", error);
                }
            })();

            // Log in the user
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: "Registration successful but login failed" });
                }
                res.json({ user });
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "Registration failed" });
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
        passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
        "/api/auth/google/callback",
        (req, res, next) => {
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                return res.redirect("/login?error=google_not_configured");
            }
            next();
        },
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            res.redirect("/dashboard");
        }
    );

    // Logout
    // Logout - Handle both paths to be safe
    const logoutHandler = (req: any, res: any, next: any) => {
        const sessionId = req.sessionID;
        console.log(`[Logout] Attempting logout for session: ${sessionId}`);

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
                console.log(`[Logout] Session destroyed successfully: ${sessionId}`);

                res.clearCookie("connect.sid", { path: '/' });
                res.json({ success: true, message: "Logged out successfully" });
            });
        });
    };

    app.post("/api/auth/logout", logoutHandler);
    app.post("/api/logout", logoutHandler); // Alias

    // Also support GET for logout link
    app.get("/api/auth/logout", logoutHandler);
    app.get("/api/logout", logoutHandler);

    // Get current user
    app.get("/api/auth/user", (req, res) => {
        // Prevent caching of user state
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
        res.header("ETag", "false"); // Disable ETag to prevent 304

        console.log(`[Auth Check] Session: ${req.sessionID}, User: ${req.user ? (req.user as any).id : 'null'}`);

        if (req.isAuthenticated()) {
            res.json({ user: req.user });
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

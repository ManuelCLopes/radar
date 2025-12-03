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
    app.set("trust proxy", 1);
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
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://127.0.0.1:5000/api/auth/google/callback",
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
            const { email, password, firstName, lastName } = req.body;

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
            });

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
    app.post("/api/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "Logout failed" });
            }
            res.json({ success: true, message: "Logged out successfully" });
        });
    });

    // Also support GET for logout link
    app.get("/api/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "Logout failed" });
            }
            res.json({ success: true, message: "Logged out successfully" });
        });
    });

    // Get current user
    app.get("/api/auth/user", (req, res) => {
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

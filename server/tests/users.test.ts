
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";

// Hoist the user mock container so it's available in the mock factory
const authState = vi.hoisted(() => ({
    user: null as any
}));

// Mock auth module BEFORE importing routes
vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        if (authState.user) {
            req.user = authState.user;
            req.isAuthenticated = () => true;
            req.login = (u: any, cb: any) => cb(null);
            req.logout = (cb: any) => cb(null);
            next();
        } else {
            res.status(401).json({ error: "Unauthorized" });
        }
    },
    setupAuth: vi.fn()
}));

// Mock storage
vi.mock("../storage", () => ({
    storage: {
        getUserByEmail: vi.fn(),
        updateUser: vi.fn(),
        updateUserPassword: vi.fn(),
        updateUserLanguage: vi.fn(),
        deleteUser: vi.fn(),
    }
}));

// Mock bcrypt
vi.mock("bcrypt", () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn(),
    }
}));

// Import routes after mocks are defined
import { registerUserRoutes } from "../routes/users";
import { storage } from "../storage";
import bcrypt from "bcrypt";

// Setup App
const app = express();
app.use(express.json());
registerUserRoutes(app);

describe("User Routes", () => {
    // Default user data
    const defaultUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        passwordHash: "hashed_password",
        provider: "local"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset auth state
        authState.user = { ...defaultUser };
    });

    describe("PATCH /api/user", () => {
        it("should update user profile successfully", async () => {
            const updateData = {
                firstName: "Updated",
                lastName: "Name",
                email: "updated@example.com"
            };

            // Mock storage behavior
            (storage.getUserByEmail as any).mockResolvedValue(null); // No email collision
            (storage.updateUser as any).mockResolvedValue({ ...defaultUser, ...updateData });

            const res = await request(app)
                .patch("/api/user")
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.user.firstName).toBe("Updated");
            expect(res.body.user.email).toBe("updated@example.com");
            expect(storage.updateUser).toHaveBeenCalledWith("user-123", expect.objectContaining(updateData));
        });

        it("should return 409 if email already exists", async () => {
            const updateData = { email: "taken@example.com" };

            // Mock email collision
            (storage.getUserByEmail as any).mockResolvedValue({ id: "other-user" });

            const res = await request(app)
                .patch("/api/user")
                .send(updateData);

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("Email already exists");
        });

        it("should validate email format", async () => {
            const res = await request(app)
                .patch("/api/user")
                .send({ email: "invalid-email" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid email format");
        });
    });

    describe("POST /api/user/password", () => {
        it("should change password successfully", async () => {
            const passwordData = {
                currentPassword: "oldPassword",
                newPassword: "newPassword123",
                confirmPassword: "newPassword123"
            };

            // Mock bcrypt
            (bcrypt.compare as any).mockResolvedValue(true); // correct password
            (bcrypt.hash as any).mockResolvedValue("new_hashed_password");

            const res = await request(app)
                .post("/api/user/password")
                .send(passwordData);

            expect(res.status).toBe(200);
            expect(storage.updateUserPassword).toHaveBeenCalledWith("user-123", "new_hashed_password");
        });

        it("should fail if passwords do not match", async () => {
            const res = await request(app)
                .post("/api/user/password")
                .send({
                    currentPassword: "old",
                    newPassword: "new",
                    confirmPassword: "mismatch"
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Passwords do not match");
        });

        it("should fail if current password is incorrect", async () => {
            const passwordData = {
                currentPassword: "wrongPassword",
                newPassword: "newPassword123",
                confirmPassword: "newPassword123"
            };

            (bcrypt.compare as any).mockResolvedValue(false);

            const res = await request(app)
                .post("/api/user/password")
                .send(passwordData);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Incorrect current password");
        });

        it("should fail if password is too short", async () => {
            const res = await request(app)
                .post("/api/user/password")
                .send({
                    currentPassword: "old",
                    newPassword: "123",
                    confirmPassword: "123"
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Password must be at least 6 characters");
        });

        it("should fail for google auth users (no passwordHash)", async () => {
            authState.user = { ...defaultUser, passwordHash: null, provider: "google" };

            const res = await request(app)
                .post("/api/user/password")
                .send({
                    currentPassword: "any",
                    newPassword: "newPass123",
                    confirmPassword: "newPass123"
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Google accounts");
        });
    });

    describe("DELETE /api/user", () => {
        it("should delete user account", async () => {
            const res = await request(app).delete("/api/user");

            expect(res.status).toBe(200);
            expect(storage.deleteUser).toHaveBeenCalledWith("user-123");
        });
    });
});

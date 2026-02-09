import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerUserRoutes } from "../routes/users";
import request from "supertest";
import bcrypt from "bcrypt";

// Mock user
const mockUser = {
    id: "user-1",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    passwordHash: "hashed_password",
    role: "user",
    plan: "essential"
};

const { mockStorage } = vi.hoisted(() => ({
    mockStorage: {
        deleteUser: vi.fn(),
        getUserByEmail: vi.fn(),
        updateUser: vi.fn(),
        updateUserPassword: vi.fn(),
        updateUserLanguage: vi.fn()
    }
}));

vi.mock("../storage", () => ({
    storage: mockStorage
}));

vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        req.user = mockUser;
        req.logout = vi.fn((cb) => cb(null));
        req.login = vi.fn((user, cb) => cb(null));
        next();
    }
}));

vi.mock("bcrypt", () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn()
    }
}));

const app = express();
app.use(express.json());
registerUserRoutes(app);

describe("User Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("DELETE /api/user", () => {
        it("should delete user account successfully", async () => {
            mockStorage.deleteUser.mockResolvedValue(true);

            const res = await request(app).delete("/api/user");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Account deleted successfully");
            expect(mockStorage.deleteUser).toHaveBeenCalledWith("user-1");
        });

        it("should handle error during deletion", async () => {
            mockStorage.deleteUser.mockRejectedValue(new Error("DB error"));

            const res = await request(app).delete("/api/user");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to delete account");
        });
    });

    describe("PATCH /api/user", () => {
        it("should update user profile successfully", async () => {
            const updatedUser = { ...mockUser, firstName: "Jane" };
            mockStorage.updateUser.mockResolvedValue(updatedUser);

            const res = await request(app)
                .patch("/api/user")
                .send({ firstName: "Jane" });

            expect(res.status).toBe(200);
            expect(res.body.user.firstName).toBe("Jane");
            expect(mockStorage.updateUser).toHaveBeenCalledWith("user-1", {
                firstName: "Jane",
                lastName: "Doe",
                email: "test@example.com"
            });
        });

        it("should reject invalid email format", async () => {
            const res = await request(app)
                .patch("/api/user")
                .send({ email: "invalid-email" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid email format");
        });

        it("should reject if email already exists", async () => {
            mockStorage.getUserByEmail.mockResolvedValue({ id: "other-user" });

            const res = await request(app)
                .patch("/api/user")
                .send({ email: "other@example.com" });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("Email already exists");
        });

        it("should handle error during update", async () => {
            mockStorage.updateUser.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .patch("/api/user")
                .send({ firstName: "Jane" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update profile");
        });
    });

    describe("POST /api/user/password", () => {
        const passwordData = {
            currentPassword: "old-password",
            newPassword: "new-password",
            confirmPassword: "new-password"
        };

        it("should change password successfully", async () => {
            (bcrypt.compare as any).mockResolvedValue(true);
            (bcrypt.hash as any).mockResolvedValue("new_hashed_password");
            mockStorage.updateUserPassword.mockResolvedValue(true);

            const res = await request(app)
                .post("/api/user/password")
                .send(passwordData);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Password updated successfully");
            expect(mockStorage.updateUserPassword).toHaveBeenCalledWith("user-1", "new_hashed_password");
        });

        it("should reject missing fields", async () => {
            const res = await request(app)
                .post("/api/user/password")
                .send({ currentPassword: "old" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("All fields are required");
        });

        it("should reject non-matching passwords", async () => {
            const res = await request(app)
                .post("/api/user/password")
                .send({ ...passwordData, confirmPassword: "wrong" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Passwords do not match");
        });

        it("should reject short passwords", async () => {
            const res = await request(app)
                .post("/api/user/password")
                .send({ ...passwordData, newPassword: "123", confirmPassword: "123" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Password must be at least 6 characters");
        });

        it("should reject incorrect current password", async () => {
            (bcrypt.compare as any).mockResolvedValue(false);

            const res = await request(app)
                .post("/api/user/password")
                .send(passwordData);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Incorrect current password");
        });

        it("should handle error during password update", async () => {
            (bcrypt.compare as any).mockResolvedValue(true);
            (bcrypt.hash as any).mockResolvedValue("new_hash");
            mockStorage.updateUserPassword.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .post("/api/user/password")
                .send(passwordData);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to change password");
        });
    });

    describe("POST /api/user/language", () => {
        it("should update language successfully", async () => {
            mockStorage.updateUserLanguage.mockResolvedValue(true);

            const res = await request(app)
                .post("/api/user/language")
                .send({ language: "es" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockStorage.updateUserLanguage).toHaveBeenCalledWith("user-1", "es");
        });

        it("should reject missing language", async () => {
            const res = await request(app)
                .post("/api/user/language")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Language is required");
        });

        it("should handle error during language update", async () => {
            mockStorage.updateUserLanguage.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .post("/api/user/language")
                .send({ language: "fr" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update language");
        });
    });
});

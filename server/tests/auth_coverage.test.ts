
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupAuth } from "../auth";
import { storage } from "../storage";
import bcrypt from "bcrypt";

// Mock passport to capture callbacks
const passportMock = vi.hoisted(() => ({
    initialize: vi.fn(() => (req: any, res: any, next: any) => next()),
    session: vi.fn(() => (req: any, res: any, next: any) => next()),
    use: vi.fn(),
    authenticate: vi.fn(() => (req: any, res: any, next: any) => next()),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
}));

vi.mock("passport", () => ({
    default: passportMock
}));

// Mock storage
vi.mock("../storage", () => ({
    storage: {
        getUser: vi.fn(),
        getUserByEmail: vi.fn(),
    }
}));

// Mock bcrypt
vi.mock("bcrypt", () => ({
    default: {
        compare: vi.fn(),
    }
}));

describe("Auth Coverage", () => {
    let app: any;

    beforeEach(() => {
        vi.clearAllMocks();
        app = {
            set: vi.fn(),
            use: vi.fn(),
            post: vi.fn(),
            get: vi.fn(),
        };
    });

    it("should register strategies and serializers", async () => {
        await setupAuth(app);
        expect(passportMock.use).toHaveBeenCalled();
        expect(passportMock.serializeUser).toHaveBeenCalled();
        expect(passportMock.deserializeUser).toHaveBeenCalled();
    });

    describe("Local Strategy", () => {
        let verifyCallback: any;

        beforeEach(async () => {
            await setupAuth(app);
            // Capture the LocalStrategy instance passed to passport.use
            // The first call to passport.use should be LocalStrategy (or we check calls)
            const calls = passportMock.use.mock.calls;
            const localStrategy = calls.find((call: any) => call[0].name === "local");
            if (localStrategy) {
                verifyCallback = localStrategy[0]._verify;
            } else {
                // Fallback if name is not set or different structure
                // LocalStrategy usually has _verify property
                verifyCallback = calls[0][0]._verify;
            }
        });

        it("should authenticate valid user", async () => {
            const mockUser = { id: 1, email: "test@example.com", passwordHash: "hash" };
            vi.mocked(storage.getUserByEmail).mockResolvedValue(mockUser as any);
            vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

            const done = vi.fn();
            await verifyCallback("test@example.com", "password", done);

            expect(storage.getUserByEmail).toHaveBeenCalledWith("test@example.com");
            expect(bcrypt.compare).toHaveBeenCalledWith("password", "hash");
            expect(done).toHaveBeenCalledWith(null, mockUser);
        });

        it("should fail if user not found", async () => {
            vi.mocked(storage.getUserByEmail).mockResolvedValue(undefined);

            const done = vi.fn();
            await verifyCallback("test@example.com", "password", done);

            expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: "Invalid email or password" }));
        });

        it("should fail if password invalid", async () => {
            const mockUser = { id: 1, email: "test@example.com", passwordHash: "hash" };
            vi.mocked(storage.getUserByEmail).mockResolvedValue(mockUser as any);
            vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

            const done = vi.fn();
            await verifyCallback("test@example.com", "password", done);

            expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: "Invalid email or password" }));
        });

        it("should fail if google login required (no password hash)", async () => {
            const mockUser = { id: 1, email: "test@example.com", passwordHash: null };
            vi.mocked(storage.getUserByEmail).mockResolvedValue(mockUser as any);

            const done = vi.fn();
            await verifyCallback("test@example.com", "password", done);

            expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ code: "GOOGLE_LOGIN_REQUIRED" }));
        });

        it("should handle errors", async () => {
            const error = new Error("Storage error");
            vi.mocked(storage.getUserByEmail).mockRejectedValue(error);

            const done = vi.fn();
            await verifyCallback("test@example.com", "password", done);

            expect(done).toHaveBeenCalledWith(error);
        });
    });

    describe("Serialization", () => {
        let serializeCallback: any;
        let deserializeCallback: any;

        beforeEach(async () => {
            await setupAuth(app);
            serializeCallback = passportMock.serializeUser.mock.calls[0][0];
            deserializeCallback = passportMock.deserializeUser.mock.calls[0][0];
        });

        it("should serialize user id", () => {
            const user = { id: 123 };
            const done = vi.fn();
            serializeCallback(user, done);
            expect(done).toHaveBeenCalledWith(null, 123);
        });

        it("should deserialize user", async () => {
            const user = { id: 123, email: "test@example.com" };
            vi.mocked(storage.getUser).mockResolvedValue(user as any);

            const done = vi.fn();
            await deserializeCallback(123, done);

            expect(storage.getUser).toHaveBeenCalledWith(123);
            expect(done).toHaveBeenCalledWith(null, user);
        });

        it("should handle deserialize error", async () => {
            const error = new Error("Storage error");
            vi.mocked(storage.getUser).mockRejectedValue(error);

            const done = vi.fn();
            await deserializeCallback(123, done);

            expect(done).toHaveBeenCalledWith(error);
        });
    });
});

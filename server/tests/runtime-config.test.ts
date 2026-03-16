import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    assertSecureProductionRuntimeConfig,
    getAllowedOrigins,
} from "../runtime-config";

describe("runtime config", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("should parse allowed origins and trim empty entries", () => {
        process.env.ALLOWED_ORIGINS = " https://app.example.com, ,https://admin.example.com ";

        expect(getAllowedOrigins()).toEqual([
            "https://app.example.com",
            "https://admin.example.com",
        ]);
    });

    it("should allow missing production variables outside production", () => {
        process.env.NODE_ENV = "development";
        delete process.env.ALLOWED_ORIGINS;
        delete process.env.DATABASE_URL;
        delete process.env.SESSION_SECRET;

        expect(() => assertSecureProductionRuntimeConfig()).not.toThrow();
    });

    it("should throw when required production variables are missing", () => {
        process.env.NODE_ENV = "production";
        delete process.env.ALLOWED_ORIGINS;
        delete process.env.DATABASE_URL;
        delete process.env.SESSION_SECRET;

        expect(() => assertSecureProductionRuntimeConfig()).toThrow(
            "Missing required production configuration: SESSION_SECRET, DATABASE_URL, ALLOWED_ORIGINS",
        );
    });

    it("should pass when required production variables are present", () => {
        process.env.NODE_ENV = "production";
        process.env.SESSION_SECRET = "test-secret";
        process.env.DATABASE_URL = "postgres://localhost:5432/db";
        process.env.ALLOWED_ORIGINS = "https://app.example.com";

        expect(() => assertSecureProductionRuntimeConfig()).not.toThrow();
    });
});

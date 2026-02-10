
import { describe, it, expect } from "vitest";
import { getRateLimitMax } from "../middleware/rate-limit";

describe("Rate Limiting Logic", () => {
    it("should return restrict limit for guests", () => {
        const req = { user: undefined } as any;
        expect(getRateLimitMax(req)).toBe(50);
    });

    it("should return standard limit for free users", () => {
        const req = { user: { plan: "free" } } as any;
        expect(getRateLimitMax(req)).toBe(200);
    });

    it("should return high limit for professional users", () => {
        const req = { user: { plan: "professional" } } as any;
        expect(getRateLimitMax(req)).toBe(1000);
    });

    it("should return standard limit for users with unknown plan", () => {
        const req = { user: { plan: "unknown" } } as any;
        expect(getRateLimitMax(req)).toBe(200);
    });
});

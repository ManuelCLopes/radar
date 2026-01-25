
// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import { hasGoogleApiKey, searchPlacesByAddress } from "../googlePlaces";
import { runReportForBusiness } from "../reports";

// Mocks
vi.mock("../googlePlaces", () => ({
    searchPlacesByAddress: vi.fn(),
    hasGoogleApiKey: vi.fn(),
}));
vi.mock("../reports", () => ({
    runReportForBusiness: vi.fn(),
}));
vi.mock("../email", () => ({
    emailService: { sendAdHocReport: vi.fn() }
}));

const authMocks = vi.hoisted(() => ({ user: null as any }));

describe("Subscription Limits", () => {
    let app: express.Express;
    let server: any;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        // Mock session needed? maybe not if we rely on auth middleware mock
        app.use((req: any, res, next) => {
            if (authMocks.user) {
                req.user = authMocks.user;
                req.isAuthenticated = () => true;
            }
            next();
        });
        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        authMocks.user = null;
        vi.spyOn(storage, "checkRateLimit").mockResolvedValue({ allowed: true });
    });

    describe("Business Limits", () => {
        it("Free plan: should allow adding 1st business", async () => {
            authMocks.user = { id: "free-user", plan: "free" };
            vi.spyOn(storage, "listBusinesses").mockResolvedValue([]);
            vi.spyOn(storage, "addBusiness").mockResolvedValue({ id: "bus-1" } as any);

            const res = await request(app).post("/api/businesses").send({
                name: "Business 1", type: "restaurant", address: "123 St", latitude: 10, longitude: 10
            });
            expect(res.status).toBe(201);
        });

        it("Free plan: should block adding 2nd business", async () => {
            authMocks.user = { id: "free-user", plan: "free" };
            vi.spyOn(storage, "listBusinesses").mockResolvedValue([{ id: "bus-1" } as any]);

            const res = await request(app).post("/api/businesses").send({
                name: "Business 2", type: "restaurant", address: "123 St", latitude: 10, longitude: 10
            });
            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Business limit reached");
        });

        it("Pro plan: should allow adding 3rd business", async () => {
            authMocks.user = { id: "pro-user", plan: "pro" };
            vi.spyOn(storage, "listBusinesses").mockResolvedValue([{ id: "b1" }, { id: "b2" }] as any);
            vi.spyOn(storage, "addBusiness").mockResolvedValue({ id: "bus-3" } as any);

            const res = await request(app).post("/api/businesses").send({
                name: "Business 3", type: "restaurant", address: "123 St", latitude: 10, longitude: 10
            });
            expect(res.status).toBe(201);
        });

        it("Pro plan: should block adding 4th business", async () => {
            authMocks.user = { id: "pro-user", plan: "pro" };
            vi.spyOn(storage, "listBusinesses").mockResolvedValue([{ id: "b1" }, { id: "b2" }, { id: "b3" }] as any);

            const res = await request(app).post("/api/businesses").send({
                name: "Business 4", type: "restaurant", address: "123 St", latitude: 10, longitude: 10
            });
            expect(res.status).toBe(403);
        });
    });

    describe("Report Limits", () => {
        it("Free plan: should block 3rd report", async () => {
            authMocks.user = { id: "free-user", plan: "free", isVerified: true }; // Verified needed
            vi.spyOn(storage, "countReportsCurrentMonth").mockResolvedValue(2);

            // Mock business existence for run-report
            vi.spyOn(storage, "getBusiness").mockResolvedValue({ id: "bus-1", userId: "free-user" } as any);

            const res = await request(app).post("/api/run-report/bus-1");
            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Report limit reached");
        });

        it("Agency plan: should allow unlimited reports", async () => {
            authMocks.user = { id: "agency-user", plan: "agency", isVerified: true };
            vi.spyOn(storage, "countReportsCurrentMonth").mockResolvedValue(100);
            vi.spyOn(storage, "getBusiness").mockResolvedValue({ id: "bus-1", userId: "agency-user" } as any);
            (runReportForBusiness as any).mockResolvedValue({});

            const res = await request(app).post("/api/run-report/bus-1");
            expect(res.status).toBe(200);
        });
    });

    describe("Radius Limits", () => {
        it("Free plan: should block radius > 5km", async () => {
            authMocks.user = { id: "free-user", plan: "free", isVerified: true };
            vi.spyOn(storage, "countReportsCurrentMonth").mockResolvedValue(0);

            const res = await request(app).post("/api/analyze-address").send({
                address: "Test", type: "restaurant", radius: 6000 // > 5000
            });
            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Radius limit reached");
        });

        it("Pro plan: should allow radius 20km", async () => {
            authMocks.user = { id: "pro-user", plan: "pro", isVerified: true };
            vi.spyOn(storage, "countReportsCurrentMonth").mockResolvedValue(0);
            (hasGoogleApiKey as any).mockReturnValue(true);
            (searchPlacesByAddress as any).mockResolvedValue([{ latitude: 0, longitude: 0 }]);
            (runReportForBusiness as any).mockResolvedValue({});
            vi.spyOn(storage, "createReport").mockResolvedValue({} as any);


            const res = await request(app).post("/api/analyze-address").send({
                address: "Test", type: "restaurant", radius: 20000
            });
            expect(res.status).toBe(200);
        });

        it("Pro plan: should block radius > 20km", async () => {
            authMocks.user = { id: "pro-user", plan: "pro", isVerified: true };

            const res = await request(app).post("/api/analyze-address").send({
                address: "Test", type: "restaurant", radius: 25000
            });
            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Radius limit reached");
        });
    });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerBusinessRoutes } from "../routes/businesses";
import request from "supertest";

// Mock user
const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "user",
    plan: "essential"
};

const { mockStorage } = vi.hoisted(() => ({
    mockStorage: {
        listBusinesses: vi.fn(),
        addBusiness: vi.fn(),
        getBusiness: vi.fn(),
        deleteBusiness: vi.fn(),
        updateBusiness: vi.fn()
    }
}));

vi.mock("../storage", () => ({
    storage: mockStorage
}));

vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
    }
}));

vi.mock("../limits", () => ({
    getPlanLimits: vi.fn(() => ({ maxBusinesses: 3, maxReportsPerMonth: 10 }))
}));

const app = express();
app.use(express.json());
registerBusinessRoutes(app);

describe("Business Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/businesses", () => {
        it("should list all businesses for user", async () => {
            const mockBusinesses = [
                { id: "biz-1", name: "Business 1", userId: "user-1" },
                { id: "biz-2", name: "Business 2", userId: "user-1" }
            ];
            mockStorage.listBusinesses.mockResolvedValue(mockBusinesses);

            const res = await request(app).get("/api/businesses");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(mockStorage.listBusinesses).toHaveBeenCalledWith("user-1");
        });

        it("should handle error listing businesses", async () => {
            mockStorage.listBusinesses.mockRejectedValue(new Error("DB error"));

            const res = await request(app).get("/api/businesses");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to list businesses");
        });
    });

    describe("POST /api/businesses", () => {
        const validBusiness = {
            name: "New Business",
            type: "restaurant",
            address: "123 Main St",
            latitude: 40.7,
            longitude: -74.0,
            locationStatus: "validated"
        };

        it("should create a business successfully", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);
            mockStorage.addBusiness.mockResolvedValue({ id: "biz-new", ...validBusiness });

            const res = await request(app).post("/api/businesses").send(validBusiness);

            expect(res.status).toBe(201);
            expect(res.body.name).toBe("New Business");
        });

        it("should reject when business limit reached", async () => {
            mockStorage.listBusinesses.mockResolvedValue([
                { id: "1" }, { id: "2" }, { id: "3" }
            ]);

            const res = await request(app).post("/api/businesses").send(validBusiness);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Business limit reached");
        });

        it("should reject invalid schema data", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);

            const res = await request(app).post("/api/businesses").send({
                name: "" // invalid - empty name
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should reject missing coordinates for validated business", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);

            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                type: "restaurant",
                address: "123 St",
                locationStatus: "validated"
                // Missing lat/lng
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("coordinates are required");
        });

        it("should reject invalid coordinate types", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);

            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                type: "restaurant",
                address: "123 St",
                latitude: "invalid",
                longitude: -74.0,
                locationStatus: "validated"
            });

            expect(res.status).toBe(400);
        });

        it("should reject zero coordinates", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);

            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                type: "restaurant",
                address: "123 St",
                latitude: 0,
                longitude: 0,
                locationStatus: "validated"
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Valid location coordinates are required");
        });

        it("should reject out-of-range coordinates via schema", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);

            const res = await request(app).post("/api/businesses").send({
                name: "Test",
                type: "restaurant",
                address: "123 St",
                latitude: 100, // Invalid - > 90, rejected by schema
                longitude: -74.0,
                locationStatus: "validated"
            });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should handle server error on create", async () => {
            mockStorage.listBusinesses.mockResolvedValue([]);
            mockStorage.addBusiness.mockRejectedValue(new Error("DB error"));

            const res = await request(app).post("/api/businesses").send(validBusiness);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to create business");
        });
    });

    describe("GET /api/businesses/:id", () => {
        it("should return business by id", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                name: "Test Business",
                userId: "user-1"
            });

            const res = await request(app).get("/api/businesses/biz-1");

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Test Business");
        });

        it("should return 404 for non-existent business", async () => {
            mockStorage.getBusiness.mockResolvedValue(null);

            const res = await request(app).get("/api/businesses/non-existent");

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                name: "Other Business",
                userId: "other-user"
            });

            const res = await request(app).get("/api/businesses/biz-1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized access to this business");
        });

        it("should handle server error", async () => {
            mockStorage.getBusiness.mockRejectedValue(new Error("DB error"));

            const res = await request(app).get("/api/businesses/biz-1");

            expect(res.status).toBe(500);
        });
    });

    describe("DELETE /api/businesses/:id", () => {
        it("should delete business successfully", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                userId: "user-1"
            });
            mockStorage.deleteBusiness.mockResolvedValue(true);

            const res = await request(app).delete("/api/businesses/biz-1");

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it("should return 404 for non-existent business", async () => {
            mockStorage.getBusiness.mockResolvedValue(null);

            const res = await request(app).delete("/api/businesses/non-existent");

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                userId: "other-user"
            });

            const res = await request(app).delete("/api/businesses/biz-1");

            expect(res.status).toBe(403);
        });

        it("should return 404 when delete returns false", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                userId: "user-1"
            });
            mockStorage.deleteBusiness.mockResolvedValue(false);

            const res = await request(app).delete("/api/businesses/biz-1");

            expect(res.status).toBe(404);
        });

        it("should handle server error", async () => {
            mockStorage.getBusiness.mockRejectedValue(new Error("DB error"));

            const res = await request(app).delete("/api/businesses/biz-1");

            expect(res.status).toBe(500);
        });
    });

    describe("PUT /api/businesses/:id", () => {
        it("should update business successfully", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                name: "Old Name",
                userId: "user-1"
            });
            mockStorage.updateBusiness.mockResolvedValue({
                id: "biz-1",
                name: "New Name",
                userId: "user-1"
            });

            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ name: "New Name" });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("New Name");
        });

        it("should reject invalid schema data", async () => {
            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ type: "invalid-type" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should reject latitude out of range via schema validation", async () => {
            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ name: "Valid Name", latitude: 100 }); // > 90, rejected by schema

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should reject longitude out of range via schema validation", async () => {
            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ name: "Valid Name", longitude: 200 }); // > 180, rejected by schema

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Validation failed");
        });

        it("should return 404 for non-existent business", async () => {
            mockStorage.getBusiness.mockResolvedValue(null);

            const res = await request(app)
                .put("/api/businesses/non-existent")
                .send({ name: "New Name" });

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                userId: "other-user"
            });

            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ name: "New Name" });

            expect(res.status).toBe(403);
        });

        it("should handle 'Business not found' error", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                userId: "user-1"
            });
            mockStorage.updateBusiness.mockRejectedValue(new Error("Business not found"));

            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ name: "New Name" });

            expect(res.status).toBe(404);
        });

        it("should handle generic server error", async () => {
            mockStorage.getBusiness.mockResolvedValue({
                id: "biz-1",
                userId: "user-1"
            });
            mockStorage.updateBusiness.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .put("/api/businesses/biz-1")
                .send({ name: "New Name" });

            expect(res.status).toBe(500);
        });
    });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import { registerReportRoutes } from "../routes/reports";
import request from "supertest";

// Mock user
const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "user",
    plan: "essential",
    isVerified: true,
    verificationToken: "token"
};

const { mockStorage, mockReports, mockGooglePlaces, mockEmail } = vi.hoisted(() => ({
    mockStorage: {
        createReport: vi.fn(),
        getBusiness: vi.fn(),
        countReportsCurrentMonth: vi.fn(),
        getReport: vi.fn(),
        getReportsByBusinessId: vi.fn(),
        getReportsByUserId: vi.fn(),
        deleteReport: vi.fn()
    },
    mockReports: {
        runReportForBusiness: vi.fn()
    },
    mockGooglePlaces: {
        searchPlacesByAddress: vi.fn(),
        hasGoogleApiKey: vi.fn()
    },
    mockEmail: {
        emailService: {
            sendAdHocReport: vi.fn()
        }
    }
}));

vi.mock("../storage", () => ({
    storage: mockStorage
}));

vi.mock("../reports", () => ({
    runReportForBusiness: mockReports.runReportForBusiness
}));

vi.mock("../auth", () => ({
    isAuthenticated: (req: any, res: any, next: any) => {
        req.user = mockUser;
        req.isAuthenticated = () => true;
        next();
    }
}));

vi.mock("../googlePlaces", () => ({
    searchPlacesByAddress: mockGooglePlaces.searchPlacesByAddress,
    hasGoogleApiKey: mockGooglePlaces.hasGoogleApiKey
}));

vi.mock("../limits", () => ({
    getPlanLimits: vi.fn(() => ({
        maxMonthlyReports: 10,
        maxRadius: 5000
    }))
}));

vi.mock("../email", () => ({
    emailService: mockEmail.emailService
}));

const app = express();
app.use(express.json());

// Add global middleware to mock auth for routes that check it manually
app.use((req: any, res, next) => {
    req.user = mockUser;
    req.isAuthenticated = () => true;
    next();
});

registerReportRoutes(app);

describe("Report Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/reports/save-existing", () => {
        it("should save existing report successfully", async () => {
            const reportData = {
                businessName: "Test Business",
                competitors: [],
                aiAnalysis: "Analysis",
                html: "<p>Report</p>"
            };
            mockStorage.createReport.mockResolvedValue({ id: "rep-1", ...reportData });

            const res = await request(app)
                .post("/api/reports/save-existing")
                .send({ businessId: "biz-1", report: reportData });

            expect(res.status).toBe(200);
            expect(res.body.id).toBe("rep-1");
            expect(mockStorage.createReport).toHaveBeenCalled();
        });

        it("should reject missing report data", async () => {
            const res = await request(app)
                .post("/api/reports/save-existing")
                .send({ businessId: "biz-1" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing report data");
        });

        it("should handle error during save", async () => {
            mockStorage.createReport.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .post("/api/reports/save-existing")
                .send({ businessId: "biz-1", report: {} });

            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/run-report/:id", () => {
        it("should run report successfully", async () => {
            mockStorage.getBusiness.mockResolvedValue({ id: "biz-1", userId: "user-1" });
            mockStorage.countReportsCurrentMonth.mockResolvedValue(5);
            mockReports.runReportForBusiness.mockResolvedValue({ id: "rep-1", status: "completed" });

            const res = await request(app)
                .post("/api/run-report/biz-1")
                .send({ language: "en" });

            expect(res.status).toBe(200);
            expect(res.body.id).toBe("rep-1");
        });

        it("should return 404 for non-existent business", async () => {
            mockStorage.getBusiness.mockResolvedValue(null);

            const res = await request(app).post("/api/run-report/non-existent");

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getBusiness.mockResolvedValue({ id: "biz-1", userId: "other-user" });

            const res = await request(app).post("/api/run-report/biz-1");

            expect(res.status).toBe(403);
            expect(res.body.error).toContain("Unauthorized access");
        });

        it("should return 403 when limit reached", async () => {
            mockStorage.getBusiness.mockResolvedValue({ id: "biz-1", userId: "user-1" });
            mockStorage.countReportsCurrentMonth.mockResolvedValue(10); // Limit is 10

            const res = await request(app).post("/api/run-report/biz-1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Report limit reached");
        });
    });

    describe("POST /api/reports/:id/email", () => {
        it("should send email successfully", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "user-1" });
            mockEmail.emailService.sendAdHocReport.mockResolvedValue(true);

            const res = await request(app)
                .post("/api/reports/rep-1/email")
                .send({ email: "test@example.com" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Email sent successfully");
        });

        it("should fail if email is missing", async () => {
            const res = await request(app)
                .post("/api/reports/rep-1/email")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Email is required");
        });

        it("should return 404 if report not found", async () => {
            mockStorage.getReport.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/reports/rep-1/email")
                .send({ email: "test@example.com" });

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "other-user" });

            const res = await request(app)
                .post("/api/reports/rep-1/email")
                .send({ email: "test@example.com" });

            expect(res.status).toBe(403);
        });

        it("should return 500 if email sending fails", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "user-1" });
            mockEmail.emailService.sendAdHocReport.mockResolvedValue(false);

            const res = await request(app)
                .post("/api/reports/rep-1/email")
                .send({ email: "test@example.com" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to send email");
        });
    });

    describe("GET /api/reports/business/:businessId", () => {
        it("should get reports for business", async () => {
            mockStorage.getBusiness.mockResolvedValue({ id: "biz-1", userId: "user-1" });
            mockStorage.getReportsByBusinessId.mockResolvedValue([{ id: "rep-1" }]);

            const res = await request(app).get("/api/reports/business/biz-1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("should return 404 for non-existent business", async () => {
            mockStorage.getBusiness.mockResolvedValue(null);

            const res = await request(app).get("/api/reports/business/non-existent");

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getBusiness.mockResolvedValue({ id: "biz-1", userId: "other-user" });

            const res = await request(app).get("/api/reports/business/biz-1");

            expect(res.status).toBe(403);
        });
    });

    describe("GET /api/reports", () => {
        it("should get user reports", async () => {
            mockStorage.getReportsByUserId.mockResolvedValue([{ id: "rep-1" }]);

            const res = await request(app).get("/api/reports");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe("GET /api/reports/history", () => {
        it("should get user report history", async () => {
            // Mock isAuthenticated for this route specifically if needed, but the global mock handles it
            mockStorage.getReportsByUserId.mockResolvedValue([{ id: "rep-1" }]);

            const res = await request(app).get("/api/reports/history");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe("GET /api/reports/:id", () => {
        it("should get report by id", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "user-1" });

            const res = await request(app).get("/api/reports/rep-1");

            expect(res.status).toBe(200);
            expect(res.body.id).toBe("rep-1");
        });

        it("should return 404 if report not found", async () => {
            mockStorage.getReport.mockResolvedValue(null);

            const res = await request(app).get("/api/reports/rep-1");

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "other-user" });

            const res = await request(app).get("/api/reports/rep-1");

            expect(res.status).toBe(403);
        });
    });

    describe("DELETE /api/reports/:id", () => {
        it("should delete report successfully", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "user-1" });
            mockStorage.deleteReport.mockResolvedValue(true);

            const res = await request(app).delete("/api/reports/rep-1");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Report deleted successfully");
        });

        it("should return 404 if report not found", async () => {
            mockStorage.getReport.mockResolvedValue(null);

            const res = await request(app).delete("/api/reports/rep-1");

            expect(res.status).toBe(404);
        });

        it("should return 403 for unauthorized access", async () => {
            mockStorage.getReport.mockResolvedValue({ id: "rep-1", userId: "other-user" });

            const res = await request(app).delete("/api/reports/rep-1");

            expect(res.status).toBe(403);
        });
    });

    describe("POST /api/analyze-address", () => {
        it("should analyze address successfully", async () => {
            mockStorage.countReportsCurrentMonth.mockResolvedValue(0);
            mockGooglePlaces.hasGoogleApiKey.mockReturnValue(true);
            mockGooglePlaces.searchPlacesByAddress.mockResolvedValue([{ latitude: 40, longitude: -70 }]);

            const generatedReport = {
                executiveSummary: "Summary",
                generatedAt: new Date(),
                id: "rep-new"
            };
            mockReports.runReportForBusiness.mockResolvedValue(generatedReport);
            mockStorage.createReport.mockResolvedValue({ ...generatedReport, id: "rep-1" });

            const res = await request(app)
                .post("/api/analyze-address")
                .send({ address: "123 St", type: "restaurant", radius: 1000 });

            expect(res.status).toBe(200);
            expect(res.body.id).toBe("rep-1");
        });

        it("should reject if missing fields", async () => {
            const res = await request(app)
                .post("/api/analyze-address")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });

        it("should reject if report limit reached", async () => {
            mockStorage.countReportsCurrentMonth.mockResolvedValue(10); // Limit reached

            const res = await request(app)
                .post("/api/analyze-address")
                .send({ address: "123 St", type: "restaurant", radius: 1000 });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Report limit reached");
        });

        it("should reject if radius limit reached", async () => {
            mockStorage.countReportsCurrentMonth.mockResolvedValue(0);

            const res = await request(app)
                .post("/api/analyze-address")
                .send({ address: "123 St", type: "restaurant", radius: 10000 }); // Limit is 5000

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Radius limit reached");
        });

        it("should return 400 if location not found", async () => {
            mockStorage.countReportsCurrentMonth.mockResolvedValue(0);
            mockGooglePlaces.hasGoogleApiKey.mockReturnValue(true);
            mockGooglePlaces.searchPlacesByAddress.mockResolvedValue([]);

            const res = await request(app)
                .post("/api/analyze-address")
                .send({ address: "Invalid Place", type: "restaurant", radius: 1000 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Location not found");
        });
    });
});

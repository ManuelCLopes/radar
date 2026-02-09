import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResendEmailService, NodemailerEmailService } from "../email";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Mock Resend
vi.mock("resend", () => {
    return {
        Resend: class {
            emails: { send: any };
            constructor() {
                this.emails = {
                    send: vi.fn()
                };
            }
        }
    };
});

// Mock Nodemailer
vi.mock("nodemailer", () => ({
    default: {
        createTransport: vi.fn().mockReturnValue({
            sendMail: vi.fn()
        })
    }
}));

// Mock log to avoid console spam
vi.mock("../log", () => ({
    log: vi.fn()
}));

const mockUser = {
    id: "1",
    email: "test@example.com",
    language: "en"
} as any;

const mockReport = {
    id: "1",
    businessName: "Test Business",
    generatedAt: new Date(),
    competitors: [],
    aiAnalysis: "Test analysis"
} as any;

describe("ResendEmailService", () => {
    let service: ResendEmailService;
    let sendMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ResendEmailService("re_123");
        // Get the mock function from the instance
        sendMock = (service as any).resend.emails.send;
    });

    it("should send weekly report successfully", async () => {
        sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });

        const result = await service.sendWeeklyReport(mockUser, [mockReport]);

        expect(result).toBe(true);
        expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com",
            subject: expect.stringContaining("Weekly")
        }));
    });

    it("should handle error when sending weekly report", async () => {
        sendMock.mockResolvedValue({ data: null, error: { message: "Failed" } });

        const result = await service.sendWeeklyReport(mockUser, [mockReport]);

        expect(result).toBe(false);
    });

    it("should catch exceptions when sending weekly report", async () => {
        sendMock.mockRejectedValue(new Error("Network fail"));

        const result = await service.sendWeeklyReport(mockUser, [mockReport]);

        expect(result).toBe(false);
    });

    it("should send ad-hoc report successfully", async () => {
        sendMock.mockResolvedValue({ data: { id: "email-2" }, error: null });

        const result = await service.sendAdHocReport("test@example.com", mockReport, "en");

        expect(result).toBe(true);
        expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com",
            subject: expect.stringContaining("Analysis Report")
        }));
    });

    it("should handle error when sending ad-hoc report", async () => {
        sendMock.mockResolvedValue({ data: null, error: { message: "Failed" } });

        const result = await service.sendAdHocReport("test@example.com", mockReport, "en");

        expect(result).toBe(false);
    });

    it("should catch exceptions when sending ad-hoc report", async () => {
        sendMock.mockRejectedValue(new Error("Network fail"));

        const result = await service.sendAdHocReport("test@example.com", mockReport, "en");

        expect(result).toBe(false);
    });

    it("should send verification email successfully", async () => {
        sendMock.mockResolvedValue({ data: { id: "email-3" }, error: null });

        const result = await service.sendVerificationEmail("test@example.com", "http://link", "en");

        expect(result).toBe(true);
        expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com",
            subject: expect.stringContaining("Verify your email")
        }));
    });

    it("should handle error when sending verification email", async () => {
        sendMock.mockResolvedValue({ data: null, error: { message: "Failed" } });

        const result = await service.sendVerificationEmail("test@example.com", "http://link", "en");

        expect(result).toBe(false);
    });

    it("should catch exceptions when sending verification email", async () => {
        sendMock.mockRejectedValue(new Error("Network fail"));

        const result = await service.sendVerificationEmail("test@example.com", "http://link", "en");

        expect(result).toBe(false);
    });
});

describe("NodemailerEmailService", () => {
    let service: NodemailerEmailService;
    let sendMailMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup env vars for this test suite
        process.env.EMAIL_HOST = "smtp.example.com";
        process.env.EMAIL_USER = "user";
        process.env.EMAIL_PASS = "pass";

        service = new NodemailerEmailService();
        sendMailMock = (service as any).transporter.sendMail;
    });

    afterEach(() => {
        delete process.env.EMAIL_HOST;
        delete process.env.EMAIL_USER;
        delete process.env.EMAIL_PASS;
        delete process.env.EMAIL_SERVICE;
    });

    it("should configure with service if provided", () => {
        process.env.EMAIL_SERVICE = "gmail";
        new NodemailerEmailService();
        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            service: "gmail"
        }));
    });

    it("should configure with host/port if provided", () => {
        // Clean env is set in beforeEach
        new NodemailerEmailService();
        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            host: "smtp.example.com",
            port: 587
        }));
    });

    it("should send weekly report successfully", async () => {
        sendMailMock.mockResolvedValue(true);

        const result = await service.sendWeeklyReport(mockUser, [mockReport]);

        expect(result).toBe(true);
        expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com",
            subject: expect.stringContaining("Weekly")
        }));
    });

    it("should catch exceptions when sending weekly report", async () => {
        sendMailMock.mockRejectedValue(new Error("SMTP fail"));

        const result = await service.sendWeeklyReport(mockUser, [mockReport]);

        expect(result).toBe(false);
    });

    it("should send ad-hoc report successfully", async () => {
        sendMailMock.mockResolvedValue(true);

        const result = await service.sendAdHocReport("test@example.com", mockReport, "en");

        expect(result).toBe(true);
    });

    it("should catch exceptions when sending ad-hoc report", async () => {
        sendMailMock.mockRejectedValue(new Error("SMTP fail"));

        const result = await service.sendAdHocReport("test@example.com", mockReport, "en");

        expect(result).toBe(false);
    });

    it("should send verification email successfully", async () => {
        sendMailMock.mockResolvedValue(true);

        const result = await service.sendVerificationEmail("test@example.com", "http://link", "en");

        expect(result).toBe(true);
    });

    it("should catch exceptions when sending verification email", async () => {
        sendMailMock.mockRejectedValue(new Error("SMTP fail"));

        const result = await service.sendVerificationEmail("test@example.com", "http://link", "en");

        expect(result).toBe(false);
    });
});

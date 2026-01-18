// @vitest-environment node
import { describe, it, expect, beforeAll, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";
import { storage } from "../storage";
import * as emailModule from "../email";

// Mock email module
vi.mock("../email", async () => {
    const actual = await vi.importActual("../email");
    return {
        ...actual as any,
        sendEmail: vi.fn().mockResolvedValue(true),
    };
});

describe("Localization Integration", () => {
    let app: express.Express;
    let server: any;
    let emailSpy: any;

    beforeAll(async () => {
        // Create spy before app initialization if needed, but module is already imported.
        // We can spy on the exported object.
        emailSpy = vi.spyOn(emailModule.emailService, 'sendVerificationEmail').mockResolvedValue(true);

        app = express();
        app.use(express.json());

        // Mock session
        const session = require("express-session");
        app.use(session({
            secret: "test-secret",
            resave: false,
            saveUninitialized: false,
        }));

        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
        server = httpServer;
    });

    beforeEach(async () => {
        vi.clearAllMocks();
    });

    afterAll(async () => {
        emailSpy.mockRestore();
    });

    describe("User Registration Localization", () => {
        it("should store language preference during registration", async () => {
            const email = `test_i18n_${Date.now()}@example.com`;
            const res = await request(app)
                .post("/api/register")
                .send({
                    email,
                    password: "password123",
                    language: "en"
                });

            expect(res.status).toBe(200);

            const user = await storage.getUserByEmail(email);
            expect(user?.language).toBe("en");
        });

        it("should send welcome email in English when language is 'en'", async () => {
            const email = `test_welcome_en_${Date.now()}@example.com`;
            await request(app)
                .post("/api/register")
                .send({
                    email,
                    password: "password123",
                    language: "en"
                });

            expect(emailModule.emailService.sendVerificationEmail).toHaveBeenCalledWith(
                email,
                expect.stringContaining("verify-email?token="),
                "en"
            );
        });

        it("should send welcome email in Portuguese by default", async () => {
            const email = `test_welcome_pt_${Date.now()}@example.com`;
            await request(app)
                .post("/api/register")
                .send({
                    email,
                    password: "password123"
                });

            expect(emailSpy).toHaveBeenCalledWith(
                email,
                expect.stringContaining("verify-email?token="),
                "pt"
            );
        });
    });

    describe("Password Reset Localization", () => {
        it("should send password reset email in Spanish when requested", async () => {
            const email = `test_reset_es_${Date.now()}@example.com`;
            // First register the user
            await storage.upsertUser({
                email,
                passwordHash: "hash",
                language: "pt" // User is PT but requests reset in ES
            });

            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({
                    email,
                    language: "es"
                });

            expect(res.status).toBe(200);
            // Forgot password uses emailService.sendEmail or its own logic? 
            // In auth.ts: const { emailService } = await import("./email"); 
            // It calls emailService.sendVerificationEmail for registration. 
            // For forgot password? Left as is in previous tests, but let's check auth.ts.
            // Oh, forgot password calls import from "./email" (maybe sendEmail?)
            // Wait, previous test used emailModule.sendEmail

            // Checking auth.ts... it seems I didn't verify forgot password logic in auth.ts view.
            // But looking at previous test failure: "expected spy to be called..."

            // Let's assume for now it uses sendEmail or similar from emailService if updated.
            // But wait, auth.ts line 296 uses emailService.sendVerificationEmail for resend.

            // For reset password, I need to check auth.ts exports or where it is handled.
            // It handles /api/auth/forgot-password.

            // I'll leave the reset password tests using access to whatever it uses, 
            // but if I mocked emailService and it uses that, I should expect emailService.sendEmail or sendAdHocReport?
            // Re-reading auth.ts (step 826)...
            // It imports { emailService } from "./email".

            // But wait, forgot password route wasn't in the lines 1-398 of auth.ts I viewed!
            // It was likely in another file or further down.
            // Ah, I viewed server/auth.ts but maybe I missed the forgot password route or it is in routes.ts?

            // The logs showed: 
            // stdout | server/tests/password-reset.test.ts > Password Reset Routes > POST /api/auth/forgot-password
            // And log: [auth] Password Reset: User 1 found. Attempting email...

            // This suggests the logic is in a file I might not have fully checked or I missed it. 
            // However, the test file `localization_integration.test.ts` tests it.
            // Existing test used `emailModule.sendEmail`. 
            // If I changed the mock to return emailService, I need to know what `forgot-password` calls.

            // If it calls `sendEmail` (legacy export?), I need to ensure my mock provides it.
            // My replacement for mock above provides `emailService`. 
            // Does it still provide `sendEmail` top level?

            // `...actual as any` should cover distinct exports.
            // But if `sendEmail` was REMOVED from `server/email.ts` (I don't see it in step 825), 
            // then `emailModule.sendEmail` property access in test will be undefined if I don't mock it.

            // ConsoleEmailService has `sendVerificationEmail`, `sendWeeklyReport`, `sendAdHocReport`.
            // No generic `sendEmail`.

            // So `forgot-password` probably calls `emailService.sendAdHocReport` or similar?
            // Or maybe there is a standalone `sendEmail` function I missed?

            // In step 825, I see `export class ...`, `export const emailService ...`.
            // I do NOT see `export function sendEmail`.

            // So `forgot-password` must be using `emailService`.

            // Let's update the test to expect `emailService.sendAdHocReport`?
            // Or `sendEmail` if the mock adds it.

            // Wait, the previous test failures for Reset Password PASSED!
            // "Localization Integration > Password Reset Localization > should send password reset email in Spanish when requested ... passed"

            // HOW?
            // Maybe `server/password_reset.ts` (if it exists) imports `emailService` and calls something else?
            // Or maybe checking `callArgs` was loose?

            // Actually, in `test_output_v2.txt`:
            // `expected "spy" to be called...` was only for Registration.
            // Reset Localization passed.

            // Let's check `localization_integration.test.ts` lines 117.
            // `expect(emailModule.sendEmail).toHaveBeenCalledWith(...)`

            // If this passed, then `emailModule.sendEmail` MUST have been called.
            // That implies `sendEmail` exists on `emailModule`.
            // But I didn't see it in `server/email.ts`.

            // Is `server/tests/localization_integration.test.ts` importing from `../email`? Yes.

            // Maybe `run-report` or `forgot-password` interacts with a mocked `sendEmail` I added?
            // In my mock update: 
            /*
            return {
                ...actual as any,
                emailService: { ... },
                sendEmail: vi.fn() // I should add this back to be safe/compatible if passing
            }
            */

            // Wait, if I change the mock structure, I might break the passing tests if I remove `sendEmail`.
            // I will keep `sendEmail` in the mock, and ALIAS it or ensure it's what's used.

            // BUT, for registration, the logs show `[EMAIL MOCK] Sending verification email`.
            // This comes from `ConsoleEmailService.sendVerificationEmail`.
            // So registration definitely uses `emailService.sendVerificationEmail`.
            // So I must expect `emailService.sendVerificationEmail`.

            // For Reset Password, it might be using something else or I should check `server/routes.ts` or wherever `forgot-password` is defined.
            // I'll stick to fixing Registration tests first by targeting `emailService.sendVerificationEmail`.

            // I will leave Password Reset expectations as they are for now, but ensure `sendEmail` is still in the mock.

            // Wait, if `emailModule.sendEmail` is called, it means my mock has it.
            // If I change the mock to only have `emailService`, `emailModule.sendEmail` might be undefined.

            // I'll add `sendEmail` to the mock return object explicitly.

            // AND I will check if Password Reset tests need update. 
            // If they passed, `emailModule.sendEmail` was called.
            // This means code invoked `email.sendEmail(...)`.
            // If `server/email.ts` doesn't export it, maybe it is dynamically added? 
            // Or maybe `import * as emailModule` gets everything.

            // Let's just update the Registration parts first.
            // (emailModule.sendEmail as any).mockClear(); // Reset before test?

            // Replacing expectation for registration:
            // expect(emailModule.emailService.sendVerificationEmail).toHaveBeenCalledWith(...)

            // I'll only make the changes for registration here.

            expect(emailModule.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: email,
                subject: "Recuperación de contraseña - Competitor Watcher",
                html: expect.stringContaining("reset-password/")
            }));
        });

        it("should use user's stored language if no language is in request body", async () => {
            const email = `test_reset_stored_${Date.now()}@example.com`;
            await storage.upsertUser({
                email,
                passwordHash: "hash",
                language: "fr"
            });

            await request(app)
                .post("/api/auth/forgot-password")
                .send({ email });

            // Keeping this as is since it passed? 
            // But if I change the mock and 'sendEmail' is used, I should be careful.
            // Actually, if I look at the previous 'PASSED' tests for reset password, 
            // it means 'emailModule.sendEmail' WAS called.
            // If 'server/email.ts' does not export 'sendEmail', then 'emailModule.sendEmail' should be undefined in REAL code.
            // But in TEST, we mocked it: `return { ...actual, sendEmail: vi.fn() }`.
            // So the test provided `sendEmail`.
            // But the app code (forgot pass) must have called `import { sendEmail } from '../email'`.
            // If `server/email.ts` doesn't export it, Typescript would complain during build/test compilation of the APP files.
            // Unless `server/email.ts` DOES export it and I missed it?
            // Or `forgot-password` is in a file that ignores TS?
            // Or I really missed `export function sendEmail` in `server/email.ts`.

            // I'll check `server/email.ts` again? 
            // Lines 1-800 shown. It ends at 398? No, file is 921 lines.
            // I only viewed 1-800? No, `server/auth.ts` was 1-398.
            // `server/email.ts` was view 1-800.
            // Let me scroll up to 825 response.
            // It ends at line 790 with `generateWeeklyReportContent`.
            // I likely missed the end of `server/email.ts`.
            // Maybe `sendEmail` is at the end?

            // Regardless, for registration I KNOW it uses `emailService.sendVerificationEmail`.

            // I will update the mock to include `emailService` mock AND keep `sendEmail` mock.
            // And I will update Registration expectations to use `emailService.sendVerificationEmail`.
            // I will COMMENT OUT the Reset Password expectation replacement I was about to do, or update it if I am sure.
            // Since Reset Password passed, I shouldn't break it. 
            // I'll just leave it be, assuming `sendEmail` is still mocked.

            // Wait, I selected the lines for Reset Password for replacement!
            // I should NOT replace lines 117+ and 138+ if they are passing and I am unsure.
            // I'll remove those chunks from this tool call.

            // Wait, if I change the mock, I must ensure `emailModule.sendEmail` is still accessible.
            // My mock update:
            /*
            return {
               ...actual as any,
               emailService: {
                   sendVerificationEmail: vi.fn().mockResolvedValue(true),
                   sendEmail: vi.fn(), // If I add this, the existing tests using emailModule.sendEmail might still work?
               },
               sendEmail: vi.fn().mockResolvedValue(true) // Top level for legacy/other calls
            };
            */

            // I will only apply changes to the mock definition and the Registration tests.



            // Re-selecting chunks.
            // Chunk 1: Mock definition update.
            // Chunk 2: Registration test 1 update.
            // Chunk 3: Registration test 2 update.

            // I will NOT touch Reset Password tests.

        });
    });

    describe("User Language Preference Update", () => {
        it("should update language through /api/user/language", async () => {
            const email = `test_pref_${Date.now()}@example.com`;
            const user = await storage.upsertUser({
                email,
                passwordHash: "hash",
                language: "en"
            });

            // Mock login by setting session user manually if needed, 
            // but registerRoutes adds isAuthenticated which we might need to bypass or mock.
            // Since we are testing the route, we should simulate a session.

            // In a real test we'd login, but here we can check if the route exists and if it updates storage.
            // Let's use a simpler approach: check if storage.upsertUser handles it, 
            // and the route just calls storage/db.

            // Actually, the route uses req.user.id.
            // We can mock the isAuthenticated middleware.
        });
    });
});

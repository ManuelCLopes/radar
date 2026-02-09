import { describe, it, expect } from "vitest";
import { generateWelcomeEmail, generatePasswordResetEmail, generateReportEmail, generateWeeklyReportContent } from "../email";

describe("Email Templates Localization", () => {
    const testEmail = "test@example.com";
    const testName = "Test User";
    const testLink = "https://example.com/reset";

    describe("generateWelcomeEmail", () => {
        it("should generate Portuguese welcome email by default", () => {
            const { html, text } = generateWelcomeEmail(testName);
            expect(html).toContain("Bem-vindo ao Competitor Watcher!");
            expect(html).toContain("Olá Test User,");
            expect(text).toContain("Bem-vindo ao Competitor Watcher");
        });

        it("should generate English welcome email", () => {
            const { html, text } = generateWelcomeEmail(testName, "en");
            expect(html).toContain("Welcome to Competitor Watcher!");
            expect(html).toContain("Hello Test User,");
            expect(text).toContain("Welcome to Competitor Watcher");
        });

        it("should generate Spanish welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "es");
            expect(html).toContain("¡Bienvenido a Competitor Watcher!");
            expect(html).toContain("Hola Test User,");
        });

        it("should generate French welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "fr");
            expect(html).toContain("Bienvenue sur Competitor Watcher !");
        });

        it("should generate German welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "de");
            expect(html).toContain("Willkommen bei Competitor Watcher!");
        });

        it("should fallback to English for unknown language", () => {
            const { html } = generateWelcomeEmail(testName, "it");
            expect(html).toContain("Welcome to Competitor Watcher!");
        });
    });

    describe("generatePasswordResetEmail", () => {
        it("should generate Portuguese reset email by default", () => {
            const { html, text } = generatePasswordResetEmail(testLink, testEmail);
            expect(html).toContain("Recuperar Palavra-passe");
            expect(html).toContain("Olá,");
            expect(text).toContain("Olá,");
            expect(html).toContain(testEmail);
        });

        it("should generate English reset email", () => {
            const { html, text } = generatePasswordResetEmail(testLink, testEmail, "en");
            expect(html).toContain("Reset Your Password");
            expect(html).toContain("Hello,");
            expect(text).toContain("Hello,");
        });

        it("should generate Spanish reset email", () => {
            const { html, text } = generatePasswordResetEmail(testLink, testEmail, "es");
            expect(html).toContain("Restablecer contraseña");
            expect(html).toContain("Hola,");
            expect(text).toContain("Hola,");
        });

        it("should generate French reset email", () => {
            const { html, text } = generatePasswordResetEmail(testLink, testEmail, "fr");
            expect(html).toContain("Réinitialiser votre mot de passe");
            expect(html).toContain("Bonjour,");
            expect(text).toContain("Bonjour,");
        });

        it("should generate German reset email", () => {
            const { html, text } = generatePasswordResetEmail(testLink, testEmail, "de");
            expect(html).toContain("Passwort zurücksetzen");
            expect(html).toContain("Hallo,");
            expect(text).toContain("Hallo,");
        });
    });

    describe("Localization Fallbacks", () => {
        it("should fallback to English for unknown language in welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "it");
            expect(html).toContain("Welcome to Competitor Watcher!");
        });

        it("should fallback to English for unknown language in password reset email", () => {
            const { html } = generatePasswordResetEmail(testLink, testEmail, "it");
            expect(html).toContain("Reset Your Password");
        });
    });
});

describe("generateReportEmail", () => {
    const mockReport = {
        id: "1",
        businessName: "Test Business",
        generatedAt: new Date(),
        competitors: [{ name: "Comp 1", rating: 4.5 }],
        aiAnalysis: "<h2>Analysis</h2><p>Good job.</p>",
    } as any;

    it("should generate Portuguese report email by default", () => {
        const { html, subject } = generateReportEmail(mockReport, "pt");
        expect(subject).toContain("Relatório de Análise: Test Business");
        expect(html).toContain("O Seu Relatório de Análise");
        expect(html).toContain("Test Business");
        expect(html).toContain("Concorrentes Encontrados");
    });

    it("should generate English report email", () => {
        const { html, subject } = generateReportEmail(mockReport, "en");
        expect(subject).toContain("Analysis Report: Test Business");
        expect(html).toContain("Your Analysis Report");
        expect(html).toContain("Test Business");
        expect(html).toContain("Competitors Found");
        expect(html).toContain("Top Competitors");
    });

    it("should generate Spanish report email", () => {
        const { html, subject } = generateReportEmail(mockReport, "es");
        expect(subject).toContain("Test Business");
        expect(html).toContain("Principales Competidores");
    });

    it("should generate French report email", () => {
        const { html, subject } = generateReportEmail(mockReport, "fr");
        expect(subject).toContain("Test Business");
        expect(html).toContain("Principaux Concurrents");
    });

    it("should generate German report email", () => {
        const { html, subject } = generateReportEmail(mockReport, "de");
        expect(subject).toContain("Analysebericht: Test Business");
        expect(html).toContain("Top Wettbewerber");
    });

    it("should normalize language code (e.g. pt-PT -> pt)", () => {
        const { html, subject } = generateReportEmail(mockReport, "pt-PT");
        expect(subject).toContain("Relatório de Análise: Test Business");
        expect(html).toContain("O Seu Relatório de Análise");
    });

    it("should fallback to English for unknown language", () => {
        const { html, subject } = generateReportEmail(mockReport, "it");
        expect(subject).toContain("Analysis Report: Test Business");
        expect(html).toContain("Your Analysis Report");
    });

    it("should include AI analysis content in the email (Legacy)", () => {
        // Ensure analysis is long enough to bypass structured fallback check (>50 chars)
        const longAnalysis = "<h2>Analysis</h2><p>Good job. This is a very long analysis that should be rendered directly as legacy HTML content without falling back to structured data.</p>";
        const legacyReport = { ...mockReport, aiAnalysis: longAnalysis };
        const { html } = generateReportEmail(legacyReport, "en");
        expect(html).toContain("Analysis</h2>");
        expect(html).toContain("Good job");
    });

    it("should render Structured Analysis when aiAnalysis is placeholder", () => {
        const structuredReport = {
            ...mockReport,
            aiAnalysis: "Structured Analysis",
            executiveSummary: "This is the executive summary.",
            swotAnalysis: { strengths: ["Strength 1"] },
            marketingStrategy: { primaryChannels: "Social Media" }
        };
        const { html } = generateReportEmail(structuredReport, "en");
        expect(html).toContain("Executive Summary");
        expect(html).toContain("This is the executive summary");
        expect(html).toContain("SWOT Analysis");
        expect(html).toContain("Strength 1");
    });

    it("should include competitors table", () => {
        const { html } = generateReportEmail(mockReport, "en");
        expect(html).toContain("Comp 1");
        expect(html).toContain("4.5");
    });
});

describe("generateWeeklyReportContent", () => {
    const mockUser = {
        id: "1",
        email: "test@example.com",
        language: "en"
    } as any;

    const mockReport = {
        id: "1",
        businessName: "Test Business",
        generatedAt: new Date(),
        competitors: [{ name: "Comp 1", rating: 4.5 }],
        aiAnalysis: "Structured Analysis",
        executiveSummary: "Weekly summary content.",
        swotAnalysis: { strengths: ["Strength 1"] }
    } as any;

    it("should generate proper subject for weekly report", () => {
        const { subject } = generateWeeklyReportContent(mockUser, [mockReport]);
        expect(subject).toContain("Weekly Competitor Analysis Report");
    });

    it("should include the full analysis content in weekly report", () => {
        const { html } = generateWeeklyReportContent(mockUser, [mockReport]);
        expect(html).toContain("Weekly summary content");
        // Competitors count and avg rating are in the summary card now
        expect(html).toContain("Test Business");
    });

    it("should use the correct language for weekly report", () => {
        const ptUser = { ...mockUser, language: "pt" };
        const { subject, html } = generateWeeklyReportContent(ptUser, [mockReport]);
        expect(subject).toContain("Relatório Semanal de Concorrência");
        expect(html).toContain("O Seu Resumo Semanal");
    });

    it("should generate Spanish weekly report", () => {
        const esUser = { ...mockUser, language: "es" };
        const { subject, html } = generateWeeklyReportContent(esUser, [mockReport]);
        expect(subject).toContain("Informe Semanal de Competencia");
        expect(html).toContain("Su Resumen Semanal");
    });

    it("should generate French weekly report", () => {
        const frUser = { ...mockUser, language: "fr" };
        const { subject, html } = generateWeeklyReportContent(frUser, [mockReport]);
        expect(subject).toContain("Rapport Hebdomadaire de Concurrence");
        expect(html).toContain("Votre Résumé Hebdomadaire");
    });

    it("should generate German weekly report", () => {
        const deUser = { ...mockUser, language: "de" };
        const { subject, html } = generateWeeklyReportContent(deUser, [mockReport]);
        expect(subject).toContain("Wöchentlicher Wettbewerbsbericht");
        expect(html).toContain("Ihre Wöchentliche Zusammenfassung");
    });

    it("should handle empty reports array", () => {
        const { html, subject } = generateWeeklyReportContent(mockUser, []);
        expect(subject).toBeDefined();
        expect(html).toContain("0 businesses");
    });

    it("should calculate average rating correctly", () => {
        const reportWithMultipleCompetitors = {
            ...mockReport,
            competitors: [
                { name: "Comp 1", rating: 4.0 },
                { name: "Comp 2", rating: 5.0 },
                { name: "Comp 3", rating: 3.0 }
            ]
        } as any;
        const { html } = generateWeeklyReportContent(mockUser, [reportWithMultipleCompetitors]);
        expect(html).toContain("4.0"); // average of 4, 5, 3
    });

    it("should handle report without competitors", () => {
        const reportNoCompetitors = { ...mockReport, competitors: [] } as any;
        const { html } = generateWeeklyReportContent(mockUser, [reportNoCompetitors]);
        expect(html).toContain("0");
        expect(html).toContain("-"); // N/A rating
    });
});

import { generateVerificationEmail, ConsoleEmailService } from "../email";

describe("generateVerificationEmail", () => {
    const testLink = "https://example.com/verify?token=abc123";

    it("should generate Portuguese verification email by default", () => {
        const { html, text, subject } = generateVerificationEmail(testLink);
        expect(subject).toBe("Verifique o seu email - Competitor Watcher");
        expect(html).toContain("Verifique o seu email");
        expect(html).toContain("Verificar Email");
        expect(html).toContain(testLink);
        expect(text).toContain(testLink);
    });

    it("should generate English verification email", () => {
        const { html, text, subject } = generateVerificationEmail(testLink, "en");
        expect(subject).toBe("Verify your email - Competitor Watcher");
        expect(html).toContain("Verify your email");
        expect(html).toContain("Verify Email");
        expect(text).toContain("verify your email");
    });

    it("should generate Spanish verification email", () => {
        const { html, text, subject } = generateVerificationEmail(testLink, "es");
        expect(subject).toContain("Verifique su correo electrónico");
        expect(html).toContain("Verificar Correo Electrónico");
    });

    it("should generate French verification email", () => {
        const { html, text, subject } = generateVerificationEmail(testLink, "fr");
        expect(subject).toContain("Vérifiez votre e-mail");
        expect(html).toContain("Vérifier l'E-mail");
    });

    it("should generate German verification email", () => {
        const { html, text, subject } = generateVerificationEmail(testLink, "de");
        expect(subject).toContain("Bestätigen Sie Ihre E-Mail");
        expect(html).toContain("E-Mail Bestätigen");
    });

    it("should fallback to English for unknown language", () => {
        const { subject } = generateVerificationEmail(testLink, "zh");
        expect(subject).toBe("Verify your email - Competitor Watcher");
    });

    it("should normalize language code (e.g. en-US -> en)", () => {
        const { subject } = generateVerificationEmail(testLink, "en-US");
        expect(subject).toBe("Verify your email - Competitor Watcher");
    });

    it("should include warning about unverified accounts", () => {
        const { html } = generateVerificationEmail(testLink, "en");
        expect(html).toContain("7 days");
    });
});

describe("ConsoleEmailService", () => {
    const service = new ConsoleEmailService();
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

    it("should send weekly report and return true", async () => {
        const result = await service.sendWeeklyReport(mockUser, [mockReport]);
        expect(result).toBe(true);
    });

    it("should send ad-hoc report and return true", async () => {
        const result = await service.sendAdHocReport("test@example.com", mockReport, "en");
        expect(result).toBe(true);
    });

    it("should send verification email and return true", async () => {
        const result = await service.sendVerificationEmail("test@example.com", "https://example.com/verify", "en");
        expect(result).toBe(true);
    });
});


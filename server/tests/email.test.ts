import { describe, it, expect } from "vitest";
import { generateWelcomeEmail, generatePasswordResetEmail, generateReportEmail } from "../email";

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

import { describe, it, expect } from "vitest";
import { generateWelcomeEmail, generatePasswordResetEmail } from "../email";

describe("Email Templates Localization", () => {
    const testEmail = "test@example.com";
    const testName = "Test User";
    const testLink = "https://example.com/reset";

    describe("generateWelcomeEmail", () => {
        it("should generate Portuguese welcome email by default", () => {
            const { html, text } = generateWelcomeEmail(testName);
            expect(html).toContain("Bem-vindo ao Competitive Watcher!");
            expect(html).toContain("Olá Test User,");
            expect(text).toContain("Bem-vindo ao Competitive Watcher");
        });

        it("should generate English welcome email", () => {
            const { html, text } = generateWelcomeEmail(testName, "en");
            expect(html).toContain("Welcome to Competitive Watcher!");
            expect(html).toContain("Hello Test User,");
            expect(text).toContain("Welcome to Competitive Watcher");
        });

        it("should generate Spanish welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "es");
            expect(html).toContain("¡Bienvenido a Competitive Watcher!");
            expect(html).toContain("Hola Test User,");
        });

        it("should generate French welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "fr");
            expect(html).toContain("Bienvenue sur Competitive Watcher !");
        });

        it("should generate German welcome email", () => {
            const { html } = generateWelcomeEmail(testName, "de");
            expect(html).toContain("Willkommen bei Competitive Watcher!");
        });

        it("should fallback to English for unknown language", () => {
            const { html } = generateWelcomeEmail(testName, "it");
            expect(html).toContain("Welcome to Competitive Watcher!");
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
            expect(html).toContain("Welcome to Competitive Watcher!");
        });

        it("should fallback to English for unknown language in password reset email", () => {
            const { html } = generatePasswordResetEmail(testLink, testEmail, "it");
            expect(html).toContain("Reset Your Password");
        });
    });
});

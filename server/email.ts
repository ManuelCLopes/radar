import nodemailer from "nodemailer";
import { Report, User } from "@shared/schema";
import { log } from "./log";

export interface EmailService {
  sendWeeklyReport(user: User, report: Report): Promise<boolean>;
}

export class ConsoleEmailService implements EmailService {
  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    console.log(`
\x1b[33m[EMAIL MOCK] ---------------------------------------------------\x1b[0m
\x1b[33mIMPORTANT: Real email sending is NOT configured. \x1b[0m
\x1b[33mSee SETUP_GUIDE.md to enable SMTP.\x1b[0m
To: ${user.email}
Subject: Your Weekly Competitor Watcher Report: ${report.businessName}
----------------------------------------------------------------
Hello ${user.firstName || "there"},

Here is your weekly competitor analysis report for ${report.businessName}.

Report ID: ${report.id}
Generated At: ${report.generatedAt}

View your full report here: https://competitorwatcher.pt/dashboard

Best,
The Competitor Watcher Team
----------------------------------------------------------------
`);
    return true;
  }
}

export class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const service = process.env.EMAIL_SERVICE;
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const secure = (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === "true";

    const config: any = {
      auth: { user, pass }
    };

    if (service) {
      config.service = service;
    } else {
      config.host = host;
      config.port = port;
      config.secure = secure;
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitive Watcher" <noreply@competitivewatcher.pt>',
        to: user.email,
        subject: `Relatório Semanal - Competitive Watcher: ${report.businessName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Weekly Competitor Analysis</h2>
            <p>Hello ${user.firstName || "there"},</p>
            <p>Here is your weekly competitor analysis report for <strong>${report.businessName}</strong>.</p>
            <p>We've analyzed the latest reviews and trends in your area.</p>
            <div style="margin: 20px 0;">
              <a href="https://competitivewatcher.pt/dashboard" style="background-color: #0a58ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Relatório Completo</a>
            </div>
            <p style="color: #666; font-size: 12px;">Generated at ${new Date(report.generatedAt).toLocaleString()}</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return false;
    }
  }
}

// Export singleton based on env
export const emailService = (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST || process.env.SMTP_HOST)
  ? new NodemailerEmailService()
  : new ConsoleEmailService();

export function generatePasswordResetEmail(resetLink: string, email: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitive Watcher</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Recuperar Palavra-passe</h2>
          <p style="color: #4b5563; line-height: 1.6;">Olá,</p>
          <p style="color: #4b5563; line-height: 1.6;">Recebemos um pedido para repor a palavra-passe da sua conta <strong>${email}</strong> no Competitive Watcher.</p>
          <p style="color: #4b5563; line-height: 1.6;">Clique no botão abaixo para escolher uma nova palavra-passe:</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="${resetLink}" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Repor Palavra-passe</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; border-top: 1px solid #f3f4f6; pt-20px;">
            Este link irá expirar em 15 minutos. Se não solicitou esta alteração, pode ignorar este email com segurança.
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitive Watcher. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  `;
  const text = `Recupere a sua palavra-passe aqui: ${resetLink}. O link expira em 15 minutos.`;
  return { html, text };
}

export function generateWelcomeEmail(name: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitive Watcher</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Bem-vindo ao Competitive Watcher! 🎉</h2>
          <p style="color: #4b5563; line-height: 1.6;">Olá ${name || "lá"},</p>
          <p style="color: #4b5563; line-height: 1.6;">Obrigado por se registar no Competitive Watcher. Estamos entusiasmados por o ajudar a acompanhar os seus concorrentes e a fazer crescer o seu negócio.</p>
          <p style="color: #4b5563; line-height: 1.6;">Comece por adicionar o seu primeiro negócio ao painel de controlo.</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="https://competitivewatcher.pt/dashboard" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Ir para o Painel</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitive Watcher. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  `;
  const text = `Bem-vindo ao Competitive Watcher, ${name || "lá"}! Estamos entusiasmados por tê-lo connosco.`;
  return { html, text };
}

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || (user ? `Competitive Watcher <${user}>` : '"Competitive Watcher" <noreply@competitivewatcher.pt>');

  if (service || host) {
    log(`Attempting to send email via ${service ? `service: ${service}` : `host: ${host}`} to ${to}...`, "email");

    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
    const secure = (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === "true";

    const config: any = {
      auth: { user, pass }
    };

    if (service) {
      config.service = service;
    } else {
      config.host = host;
      config.port = port;
      config.secure = secure;
    }

    try {
      const transporter = nodemailer.createTransport(config);

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
      });

      log(`✅ Success! Message sent: ${info.messageId}`, "email");
    } catch (error) {
      log(`❌ Failed to send email to ${to}: ${error}`, "email");
      throw error; // Re-throw to be caught by route handler
    }
  } else {
    console.log(`
\x1b[33m[EMAIL MOCK] ---------------------------------------------------\x1b[0m
\x1b[33mIMPORTANT: Real email sending is NOT configured. \x1b[0m
\x1b[33mSee SETUP_GUIDE.md to enable SMTP.\x1b[0m
To: ${to}
Subject: ${subject}
----------------------------------------------------------------
${text}
----------------------------------------------------------------
    `);
  }
  return true;
}

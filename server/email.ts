import nodemailer from "nodemailer";
import { Report, User } from "@shared/schema";

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
        from: process.env.SMTP_FROM || '"Competitor Watcher" <noreply@competitorwatcher.pt>',
        to: user.email,
        subject: `Your Weekly Competitor Watcher Report: ${report.businessName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Weekly Competitor Analysis</h2>
            <p>Hello ${user.firstName || "there"},</p>
            <p>Here is your weekly competitor analysis report for <strong>${report.businessName}</strong>.</p>
            <p>We've analyzed the latest reviews and trends in your area.</p>
            <div style="margin: 20px 0;">
              <a href="https://competitorwatcher.pt/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Report</a>
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
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Competitor Watcher account associated with ${email}.</p>
      <p>Click the button below to reset your password:</p>
      <div style="margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Link expires in 15 minutes.</p>
    </div>
  `;
  const text = `Reset your password: ${resetLink}`;
  return { html, text };
}

export function generateWelcomeEmail(name: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Competitor Watcher!</h2>
      <p>Hello ${name || "there"},</p>
      <p>Thank you for signing up for Competitor Watcher. We're excited to help you track your competitors and grow your business.</p>
      <p>Get started by adding your first business to your dashboard.</p>
      <div style="margin: 20px 0;">
        <a href="https://competitorwatcher.pt/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      </div>
    </div>
  `;
  const text = `Welcome to Competitor Watcher, ${name || "there"}! We're excited to have you.`;
  return { html, text };
}

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitor Watcher" <noreply@competitorwatcher.pt>';

  if (service || host) {
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

    const transporter = nodemailer.createTransport(config);

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
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

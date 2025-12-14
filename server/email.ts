import nodemailer from "nodemailer";
import { Report, User } from "@shared/schema";

export interface EmailService {
  sendWeeklyReport(user: User, report: Report): Promise<boolean>;
}

export class ConsoleEmailService implements EmailService {
  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    console.log(`
[EMAIL MOCK] ---------------------------------------------------
To: ${user.email}
Subject: Your Weekly Radar Report: ${report.businessName}
----------------------------------------------------------------
Hello ${user.firstName || "there"},

Here is your weekly competitor analysis report for ${report.businessName}.

Report ID: ${report.id}
Generated At: ${report.generatedAt}

View your full report here: https://radar.example.com/dashboard

Best,
The Radar Team
----------------------------------------------------------------
`);
    return true;
  }
}

export class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Radar" <noreply@radar.com>',
        to: user.email,
        subject: `Your Weekly Radar Report: ${report.businessName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Weekly Competitor Analysis</h2>
            <p>Hello ${user.firstName || "there"},</p>
            <p>Here is your weekly competitor analysis report for <strong>${report.businessName}</strong>.</p>
            <p>We've analyzed the latest reviews and trends in your area.</p>
            <div style="margin: 20px 0;">
              <a href="https://radar.example.com/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Report</a>
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
export const emailService = process.env.SMTP_HOST
  ? new NodemailerEmailService()
  : new ConsoleEmailService();

export function generatePasswordResetEmail(resetLink: string, email: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Radar account associated with ${email}.</p>
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

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Radar" <noreply@radar.com>',
      to,
      subject,
      html,
      text,
    });
  } else {
    console.log(`
[EMAIL MOCK] ---------------------------------------------------
To: ${to}
Subject: ${subject}
----------------------------------------------------------------
${text}
----------------------------------------------------------------
    `);
  }
  return true;
}

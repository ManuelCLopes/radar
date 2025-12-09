import nodemailer from 'nodemailer';

const isProduction = process.env.NODE_ENV === 'production';

// Email configuration from environment variables
const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!transporter) {
        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            console.warn('[Email] Email credentials not configured. Emails will be logged to console.');
            return null;
        }

        transporter = nodemailer.createTransporter(emailConfig);
        console.log('[Email] Email service configured successfully');
    }
    return transporter;
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const transport = getTransporter();

    if (!transport) {
        // Fallback: log to console in development
        console.log('[Email] Would send email:', {
            to: options.to,
            subject: options.subject,
            preview: options.text || options.html.substring(0, 100),
        });
        return true;
    }

    try {
        const info = await transport.sendMail({
            from: process.env.EMAIL_FROM || '"Radar" <noreply@radar.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });

        console.log('[Email] Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('[Email] Failed to send email:', error);
        return false;
    }
}

export function generatePasswordResetEmail(resetLink: string, userEmail: string): { html: string; text: string } {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔐 Recuperação de Password</h1>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>Recebemos um pedido para redefinir a password da sua conta <strong>${userEmail}</strong>.</p>
          <p>Para criar uma nova password, clique no botão abaixo:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Redefinir Password</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="background: #fff; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; word-break: break-all; font-size: 14px;">${resetLink}</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este link expira em <strong>15 minutos</strong> e só pode ser usado uma vez.
          </div>
          <p>Se não solicitou esta alteração, pode ignorar este email em segurança. A sua password permanecerá inalterada.</p>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Radar - Análise de Concorrência</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
Recuperação de Password - Radar

Olá,

Recebemos um pedido para redefinir a password da sua conta ${userEmail}.

Para criar uma nova password, aceda ao seguinte link:
${resetLink}

⚠️ IMPORTANTE: Este link expira em 15 minutos e só pode ser usado uma vez.

Se não solicitou esta alteração, pode ignorar este email em segurança.

---
Radar - Análise de Concorrência
Este é um email automático, por favor não responda.
  `.trim();

    return { html, text };
}

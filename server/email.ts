import nodemailer from "nodemailer";
import { Resend } from "resend";
import { Report, User } from "@shared/schema";
import { log } from "./log";

export interface EmailService {
  sendWeeklyReport(user: User, reports: Report[]): Promise<boolean>;
  sendAdHocReport(to: string, report: Report, lang: string): Promise<boolean>;
  sendVerificationEmail(to: string, verificationLink: string, lang: string): Promise<boolean>;
}

export class ConsoleEmailService implements EmailService {
  async sendWeeklyReport(user: User, reports: Report[]): Promise<boolean> {
    console.log(`[EMAIL MOCK] Sending weekly report email to ${user.email} with ${reports.length} reports`);
    return true;
  }

  async sendAdHocReport(to: string, report: Report, lang: string): Promise<boolean> {
    console.log(`[EMAIL MOCK] Sending ad-hoc email to ${to} (Content suppressed)`);
    return true;
  }

  async sendVerificationEmail(to: string, verificationLink: string, lang: string): Promise<boolean> {
    const { subject, text } = generateVerificationEmail(verificationLink, lang);
    console.log(`[EMAIL MOCK] Sending verification email to ${to}`);
    console.log(`[EMAIL MOCK] Subject: ${subject}`);
    console.log(`[EMAIL MOCK] Link: ${verificationLink}`);
    return true;
  }
}

export class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
    log("[EmailService] Initialized with Resend API", "email");
  }

  async sendWeeklyReport(user: User, reports: Report[]): Promise<boolean> {
    try {
      const { html, text, subject } = generateWeeklyReportContent(user, reports);
      const from = process.env.EMAIL_FROM || "Competitor Watcher <noreply@competitorwatcher.pt>";

      const data = await this.resend.emails.send({
        from,
        to: user.email,
        subject,
        html,
        text
      });

      if (data.error) {
        console.error("[Resend] Error sending weekly report:", data.error);
        return false;
      }

      log(`[Resend] Weekly report sent to ${user.email}: ${data.data?.id}`, "email");
      return true;
    } catch (error) {
      console.error("[Resend] Failed to send weekly report:", error);
      return false;
    }
  }

  async sendAdHocReport(to: string, report: Report, lang: string): Promise<boolean> {
    // ... (existing implementation)
    try {
      const { html, text, subject } = generateReportEmail(report, lang);
      const from = process.env.EMAIL_FROM || "Competitor Watcher <noreply@competitorwatcher.pt>";

      const data = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        text
      });

      if (data.error) {
        console.error("[Resend] Error sending ad-hoc report:", data.error);
        return false;
      }

      log(`[Resend] Ad-hoc report sent to ${to}: ${data.data?.id}`, "email");
      return true;
    } catch (error) {
      console.error("[Resend] Failed to send ad-hoc report:", error);
      return false;
    }
  }

  async sendVerificationEmail(to: string, verificationLink: string, lang: string): Promise<boolean> {
    try {
      const { html, text, subject } = generateVerificationEmail(verificationLink, lang);
      const from = process.env.EMAIL_FROM || "Competitor Watcher <noreply@competitorwatcher.pt>";

      const data = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        text
      });

      if (data.error) {
        console.error("[Resend] Error sending verification email:", data.error);
        return false;
      }

      log(`[Resend] Verification email sent to ${to}: ${data.data?.id}`, "email");
      return true;
    } catch (error) {
      console.error("[Resend] Failed to send verification email:", error);
      return false;
    }
  }
}

export class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const service = process.env.EMAIL_SERVICE;
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const portEnv = process.env.EMAIL_PORT || process.env.SMTP_PORT;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const secureEnv = process.env.EMAIL_SECURE || process.env.SMTP_SECURE;

    const config: any = {
      auth: { user, pass }
    };

    if (service) {
      config.service = service;
      log(`[EmailService] Configured using service: ${service}`, "email");
    } else {
      // Default to port 587 (STARTTLS)
      const defaultPort = 587;
      const defaultSecure = false;

      config.host = host;
      config.port = portEnv ? parseInt(portEnv) : defaultPort;
      config.secure = secureEnv ? secureEnv === "true" : defaultSecure;

      log(`[EmailService] Configured using host: ${config.host}:${config.port} (secure: ${config.secure})`, "email");
    }

    // Force IPv4 and set timeouts
    config.family = 4;
    config.connectionTimeout = 10000;
    config.greetingTimeout = 10000;

    this.transporter = nodemailer.createTransport(config);
  }

  async sendWeeklyReport(user: User, reports: Report[]): Promise<boolean> {
    try {
      const { html, text, subject } = generateWeeklyReportContent(user, reports);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitor Watcher" <noreply@competitorwatcher.pt>',
        to: user.email,
        subject,
        html,
        text, // fallback
      });
      return true;
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return false;
    }
  }

  async sendAdHocReport(to: string, report: Report, lang: string): Promise<boolean> {
    try {
      const { html, text, subject } = generateReportEmail(report, lang);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitor Watcher" <noreply@competitorwatcher.pt>',
        to: to,
        subject: subject,
        html: html,
        text: text,
      });
      return true;
    } catch (error) {
      console.error("[EmailService] Failed to send ad-hoc email:", error);
      return false;
    }
  }

  async sendVerificationEmail(to: string, verificationLink: string, lang: string): Promise<boolean> {
    try {
      const { html, text, subject } = generateVerificationEmail(verificationLink, lang);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitor Watcher" <noreply@competitorwatcher.pt>',
        to: to,
        subject: subject,
        html: html,
        text: text,
      });
      return true;
    } catch (error) {
      console.error("[EmailService] Failed to send verification email:", error);
      return false;
    }
  }
}

// Export singleton based on env
export const emailService: EmailService = (process.env.RESEND_API_KEY)
  ? new ResendEmailService(process.env.RESEND_API_KEY)
  : (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST || process.env.SMTP_HOST)
    ? new NodemailerEmailService()
    : new ConsoleEmailService();

export function generatePasswordResetEmail(resetLink: string, email: string, lang: string = "pt") {
  const translations: Record<string, any> = {
    pt: {
      title: "Recuperar Palavra-passe",
      greeting: "Olá,",
      message: `Recebemos um pedido para repor a palavra-passe da sua conta <strong>${email}</strong> no Competitor Watcher.`,
      instruction: "Clique no botão abaixo para escolher uma nova palavra-passe:",
      button: "Repor Palavra-passe",
      disclaimer: "Este link irá expirar em 15 minutos. Se não solicitou esta alteração, pode ignorar este email com segurança.",
      footer: "Todos os direitos reservados.",
      text: `Olá, recupere a sua palavra-passe aqui: ${resetLink}. O link expira em 15 minutos.`
    },
    en: {
      title: "Reset Your Password",
      greeting: "Hello,",
      message: `We received a request to reset the password for your Competitor Watcher account associated with <strong>${email}</strong>.`,
      instruction: "Click the button below to choose a new password:",
      button: "Reset Password",
      disclaimer: "This link will expire in 15 minutes. If you didn't request this change, you can safely ignore this email.",
      footer: "All rights reserved.",
      text: `Hello, reset your password here: ${resetLink}. Link expires in 15 minutes.`
    },
    es: {
      title: "Restablecer contraseña",
      greeting: "Hola,",
      message: `Hemos recibido uma solicitud para restablecer la contraseña de su cuenta de Competitor Watcher asociada con <strong>${email}</strong>.`,
      instruction: "Haga clic en el botón de abajo para elegir una nueva contraseña:",
      button: "Restablecer contraseña",
      disclaimer: "Este enlace caducará en 15 minutos. Si no solicitó este cambio, pode ignorar este correo electrónico de forma segura.",
      footer: "Todos los derechos reservados.",
      text: `Hola, restablezca su contraseña aquí: ${resetLink}. El enlace caduca en 15 minutos.`
    },
    fr: {
      title: "Réinitialiser votre mot de passe",
      greeting: "Bonjour,",
      message: `Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Competitor Watcher associé à <strong>${email}</strong>.`,
      instruction: "Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :",
      button: "Réinitialiser le mot de passe",
      disclaimer: "Ce lien expirera dans 15 minutes. Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité.",
      footer: "Tous droits réservés.",
      text: `Bonjour, réinitialisez votre mot de passe ici : ${resetLink}. Le lien expire en 15 minutes.`
    },
    de: {
      title: "Passwort zurücksetzen",
      greeting: "Hallo,",
      message: `Wir haben eine Anfrage zum Zurücksetzen des Passworts für Ihr Competitor Watcher-Konto erhalten, das mit <strong>${email}</strong> verknüpft ist.`,
      instruction: "Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu wählen:",
      button: "Passwort zurücksetzen",
      disclaimer: "Dieser Link läuft in 15 Minuten ab. Wenn Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.",
      footer: "Alle Rechte vorbehalten.",
      text: `Hallo, setzen Sie Ihr Passwort hier zurück: ${resetLink}. Der Link läuft in 15 Minuten ab.`
    }
  };

  const normalizedLang = lang.substring(0, 2).toLowerCase();
  const t = translations[normalizedLang] || translations.en;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitor Watcher</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${t.title}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${t.greeting}</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.message}</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.instruction}</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="${resetLink}" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${t.button}</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
            ${t.disclaimer}
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitor Watcher. ${t.footer}</p>
        </div>
      </div>
    </div>
  `;
  return { html, text: t.text };
}

export function generateVerificationEmail(link: string, lang: string = "pt") {
  const translations: Record<string, any> = {
    pt: {
      subject: "Verifique o seu email - Competitor Watcher",
      title: "Verifique o seu email",
      greeting: "Olá,",
      message: "Obrigado por se registar no Competitor Watcher. Por favor, confirme o seu endereço de email para ativar a sua conta e começar a gerar relatórios.",
      instruction: "Clique no botão abaixo para verificar o seu email:",
      button: "Verificar Email",
      warning: "Contas não verificadas serão eliminadas automaticamente após 7 dias.",
      footer: "Todos os direitos reservados.",
      text: `Olá, verifique o seu email clicando no link: ${link}`
    },
    en: {
      subject: "Verify your email - Competitor Watcher",
      title: "Verify your email",
      greeting: "Hello,",
      message: "Thanks for signing up for Competitor Watcher. Please confirm your email address to activate your account and start generating reports.",
      instruction: "Click the button below to verify your email:",
      button: "Verify Email",
      warning: "Unverified accounts will be automatically deleted after 7 days.",
      footer: "All rights reserved.",
      text: `Hello, verify your email by clicking the link: ${link}`
    },
    es: {
      subject: "Verifique su correo electrónico - Competitor Watcher",
      title: "Verifique su correo electrónico",
      greeting: "Hola,",
      message: "Gracias por registrarse en Competitor Watcher. Confirme su dirección de correo electrónico para activar su cuenta y comenzar a generar informes.",
      instruction: "Haga clic en el botón de abajo para verificar su correo electrónico:",
      button: "Verificar Correo Electrónico",
      warning: "Las cuentas no verificadas se eliminarán automáticamente después de 7 días.",
      footer: "Todos los derechos reservados.",
      text: `Hola, verifique su correo electrónico haciendo clic en el enlace: ${link}`
    },
    fr: {
      subject: "Vérifiez votre e-mail - Competitor Watcher",
      title: "Vérifiez votre e-mail",
      greeting: "Bonjour,",
      message: "Merci de vous être inscrit sur Competitor Watcher. Veuillez confirmer votre adresse e-mail pour activer votre compte et commencer à générer des rapports.",
      instruction: "Cliquez sur le bouton ci-dessous pour vérifier votre e-mail :",
      button: "Vérifier l'E-mail",
      warning: "Les comptes non vérifiés seront automatiquement supprimés après 7 jours.",
      footer: "Tous droits réservés.",
      text: `Bonjour, vérifiez votre e-mail en cliquant sur le lien : ${link}`
    },
    de: {
      subject: "Bestätigen Sie Ihre E-Mail - Competitor Watcher",
      title: "Bestätigen Sie Ihre E-Mail",
      greeting: "Hallo,",
      message: "Vielen Dank für Ihre Anmeldung bei Competitor Watcher. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren und Berichte zu erstellen.",
      instruction: "Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail zu bestätigen:",
      button: "E-Mail Bestätigen",
      warning: "Nicht verifizierte Konten werden nach 7 Tagen automatisch gelöscht.",
      footer: "Alle Rechte vorbehalten.",
      text: `Hallo, bestätigen Sie Ihre E-Mail, indem Sie auf den Link klicken: ${link}`
    }
  };

  const normalizedLang = lang.substring(0, 2).toLowerCase();
  const t = translations[normalizedLang] || translations.en;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitor Watcher</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${t.title}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${t.greeting}</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.message}</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.instruction}</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="${link}" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${t.button}</a>
          </div>
           <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin-top: 20px; font-weight: 500;">
            ⚠️ ${t.warning}
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitor Watcher. ${t.footer}</p>
        </div>
      </div>
    </div>
  `;
  return { html, text: t.text, subject: t.subject };
}

export function generateWelcomeEmail(name: string, lang: string = "pt") {
  const translations: Record<string, any> = {
    pt: {
      title: "Bem-vindo ao Competitor Watcher! 🎉",
      greeting: name ? `Olá ${name},` : "Olá,",
      message: "Obrigado por se registar no Competitor Watcher. Estamos entusiasmados por o ajudar a acompanhar os seus concorrentes e a fazer crescer o seu negócio.",
      action: "Comece por adicionar o seu primeiro negócio ao painel de controlo.",
      button: "Ir para o Painel",
      footer: "Todos os direitos reservados.",
      text: `Bem-vindo ao Competitor Watcher, ${name || "lá"}! Estamos entusiasmados por tê-lo connosco.`
    },
    en: {
      title: "Welcome to Competitor Watcher! 🎉",
      greeting: name ? `Hello ${name},` : "Hello,",
      message: "Thank you for signing up for Competitor Watcher. We're excited to help you track your competitors and grow your business.",
      action: "Get started by adding your first business to your dashboard.",
      button: "Go to Dashboard",
      footer: "All rights reserved.",
      text: `Welcome to Competitor Watcher, ${name || "there"}! We're excited to have you with us.`
    },
    es: {
      title: "¡Bienvenido a Competitor Watcher! 🎉",
      greeting: name ? `Hola ${name},` : "Hola,",
      message: "Gracias por registrarte en Competitor Watcher. Estamos emocionados de ayudarte a rastrear a tus competidores y hacer crecer tu negocio.",
      action: "Comience agregando su primer negocio a su panel de control.",
      button: "Ir al Panel",
      footer: "Todos los derechos reservados.",
      text: `¡Bienvenido a Competitor Watcher! Estamos emocionados de tenerte con nosotros.`
    },
    fr: {
      title: "Bienvenue sur Competitor Watcher ! 🎉",
      greeting: name ? `Bonjour ${name},` : "Bonjour,",
      message: "Merci de vous être inscrit sur Competitor Watcher. Nous sommes ravis de vous aider à suivre vos concurrents et à développer votre entreprise.",
      action: "Commencez par ajouter votre première entreprise à votre tableau de bord.",
      button: "Accéder au tableau de bord",
      footer: "Tous droits réservés.",
      text: `Bienvenue sur Competitor Watcher ! Nous sommes ravis de vous avoir parmi nous.`
    },
    de: {
      title: "Willkommen bei Competitor Watcher! 🎉",
      greeting: name ? `Hallo ${name},` : "Hallo,",
      message: "Vielen Dank für Ihre Anmeldung bei Competitor Watcher. Wir freuen uns, Ihnen dabei zu helfen, Ihre Wettbewerber zu verfolgen und Ihr Geschäft auszubauen.",
      action: "Beginnen Sie, indem Sie Ihr erstes Unternehmen zu Ihrem Dashboard hinzufügen.",
      button: "Zum Dashboard gehen",
      footer: "Alle Rechte vorbehalten.",
      text: `Willkommen bei Competitor Watcher, ${name || "dort"}! Wir freuen uns, Sie dabei zu haben.`
    }
  };

  const normalizedLang = lang.substring(0, 2).toLowerCase();
  const t = translations[normalizedLang] || translations.en;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitor Watcher</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${t.title}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${t.greeting},</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.message}</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.action}</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="https://competitorwatcher.pt/dashboard" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${t.button}</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitor Watcher. ${t.footer}</p>
        </div>
      </div>
      </div>
    </div>
  `;
  return { html, text: t.text };
}

// Helper to format structured analysis into HTML
function formatStructuredAnalysis(report: Report, lang: string): string {
  // Safe accessors for JSONB fields
  const getField = (field: any) => field || {};

  const swot = getField(report.swotAnalysis);
  const marketing = getField(report.marketingStrategy);
  const audience = getField(report.targetAudience);
  const trends = report.marketTrends as string[] || [];
  const summary = report.executiveSummary || "";

  // Note: Localized headers could be expanded, defaulting to English/Portuguese mix for now or reusing existing lang
  // For simplicity complying with strict length, we'll use simple headers. 
  // Ideally this should use the 'lang' param for headers.

  const headers = {
    pt: { summary: "Resumo Executivo", swot: "Análise SWOT", strategy: "Estratégia de Marketing", audience: "Público-Alvo", trends: "Tendências de Mercado" },
    en: { summary: "Executive Summary", swot: "SWOT Analysis", strategy: "Marketing Strategy", audience: "Target Audience", trends: "Market Trends" }
  };
  const t = headers[lang === 'pt' ? 'pt' : 'en'] || headers.en;

  let html = "";

  if (summary) {
    html += `<div style="margin-bottom: 24px;">
      <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${t.summary}</h3>
      <p style="color: #334155; line-height: 1.6;">${summary}</p>
    </div>`;
  }

  if (swot.strengths || swot.weaknesses) {
    html += `<div style="margin-bottom: 24px;">
      <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${t.swot}</h3>
      <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
        ${['Strengths', 'Weaknesses', 'Opportunities', 'Threats'].map(key => {
      const items = swot[key.toLowerCase()] as string[];
      if (!items?.length) return '';
      const color = key === 'Strengths' ? '#166534' : key === 'Weaknesses' ? '#991b1b' : key === 'Opportunities' ? '#1e40af' : '#ea580c';
      return `
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid ${color};">
              <strong style="color: ${color}; display: block; margin-bottom: 8px;">${key}</strong>
              <ul style="margin: 0; padding-left: 20px; color: #334155;">
                ${items.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
              </ul>
            </div>`;
    }).join('')}
      </div>
    </div>`;
  }

  if (marketing.primaryChannels) {
    html += `<div style="margin-bottom: 24px;">
       <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${t.strategy}</h3>
       <p><strong>Primary Channels:</strong> ${marketing.primaryChannels}</p>
       <p><strong>Content Ideas:</strong> ${marketing.contentIdeas}</p>
       <p><strong>Promotional Tactics:</strong> ${marketing.promotionalTactics}</p>
    </div>`;
  }

  if (trends.length > 0) {
    html += `<div style="margin-bottom: 24px;">
      <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${t.trends}</h3>
      <ul style="color: #334155; line-height: 1.6; padding-left: 20px; margin: 0;">
        ${trends.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
      </ul>
    </div>`;
  }

  return html || "<p>Analysis data not available in structured format.</p>";
}

export function generateReportEmail(report: Report, lang: string = "pt") {
  const translations: Record<string, any> = {
    pt: {
      subject: `Relatório de Análise: ${report.businessName}`,
      title: "O Seu Relatório de Análise",
      greeting: "Aqui está o relatório que solicitou.",
      generatedAt: "Gerado em",
      competitors: "Concorrentes Encontrados",
      rating: "Avaliação Média",
      viewOnline: "Ver no Dashboard",
      footer: "Todos os direitos reservados.",
      topCompetitors: "Principais Concorrentes",
      na: "S/D",
      text: `O seu relatório para ${report.businessName} está pronto. Veja-o online em https://competitorwatcher.pt/dashboard`
    },
    en: {
      subject: `Analysis Report: ${report.businessName}`,
      title: "Your Analysis Report",
      greeting: "Here is the report you requested.",
      generatedAt: "Generated at",
      competitors: "Competitors Found",
      rating: "Average Rating",
      viewOnline: "View in Dashboard",
      footer: "All rights reserved.",
      topCompetitors: "Top Competitors",
      na: "N/A",
      text: `Your report for ${report.businessName} is ready. View it online at https://competitorwatcher.pt/dashboard`
    },
    es: {
      subject: `Informe de Análisis: ${report.businessName}`,
      title: "Su Informe de Análisis",
      greeting: "Aquí tiene el informe que solicitó.",
      generatedAt: "Generado el",
      competitors: "Competidores Encontrados",
      rating: "Calificación Promedio",
      viewOnline: "Ver en el Panel",
      footer: "Todos los derechos reservados.",
      topCompetitors: "Principales Competidores",
      na: "N/D",
      text: `Su informe para ${report.businessName} está listo. Véalo en línea en https://competitorwatcher.pt/dashboard`
    },
    fr: {
      subject: `Rapport d'Analyse : ${report.businessName}`,
      title: "Votre Rapport d'Analyse",
      greeting: "Voici le rapport que vous avez demandé.",
      generatedAt: "Généré le",
      competitors: "Concurrents Trouvés",
      rating: "Note Moyenne",
      viewOnline: "Voir le Tableau de Bord",
      footer: "Tous droits réservés.",
      topCompetitors: "Principaux Concurrents",
      na: "N/D",
      text: `Votre rapport pour ${report.businessName} est prêt. Consultez-le en ligne sur https://competitorwatcher.pt/dashboard`
    },
    de: {
      subject: `Analysebericht: ${report.businessName}`,
      title: "Ihr Analysebericht",
      greeting: "Hier ist der von Ihnen angeforderte Bericht.",
      generatedAt: "Generiert am",
      competitors: "Gefundene Wettbewerber",
      rating: "Durchschnittliche Bewertung",
      viewOnline: "Im Dashboard anzeigen",
      footer: "Alle Rechte vorbehalten.",
      topCompetitors: "Top Wettbewerber",
      na: "N/V",
      text: `Ihr Bericht für ${report.businessName} ist bereit. Sehen Sie ihn online unter https://competitorwatcher.pt/dashboard an`
    }
  };

  const normalizedLang = lang.substring(0, 2).toLowerCase();
  const t = translations[normalizedLang] || translations.en;

  const avgRating = report.competitors && report.competitors.length > 0
    ? (report.competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / report.competitors.length).toFixed(1)
    : t.na;

  let formattedAnalysis = "";

  // Check if we need to use structured analysis (if legacy text is just the placeholder)
  if (!report.aiAnalysis || report.aiAnalysis === "Structured Analysis" || report.aiAnalysis.length < 50) {
    formattedAnalysis = formatStructuredAnalysis(report, normalizedLang);
  } else {
    // Legacy mapping for old string reports
    formattedAnalysis = report.aiAnalysis
      .replace(/<h2/g, '<h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;"')
      .replace(/<h3/g, '<h3 style="color: #1e40af; font-size: 16px; margin-top: 16px;"')
      .replace(/<ul/g, '<ul style="padding-left: 20px; margin-bottom: 16px;"')
      .replace(/<li/g, '<li style="margin-bottom: 8px;"')
      .replace(/<p/g, '<p style="margin-bottom: 12px; line-height: 1.6;"');
  }

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background-color: #f8fafc; color: #334155;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 20px;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <img src="https://competitorwatcher.pt/logo.png" alt="Competitor Watcher" style="height: 40px; width: auto;" />
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <h2 style="color: #0f172a; margin-top: 0;">${t.title}</h2>
          <p style="font-size: 16px;">${t.greeting}</p>
          
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e40af;">${report.businessName}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${t.generatedAt}: ${new Date(report.generatedAt).toLocaleDateString()}</p>
            
            <div style="display: flex; gap: 24px; margin-top: 16px;">
              <div>
                <span style="font-size: 20px; font-weight: bold; color: #2563eb;">${report.competitors?.length || 0}</span>
                <span style="font-size: 13px; display: block; color: #64748b;">${t.competitors}</span>
              </div>
              <div>
                <span style="font-size: 20px; font-weight: bold; color: #ca8a04;">${avgRating}</span>
                <span style="font-size: 13px; display: block; color: #64748b;">${t.rating}</span>
              </div>
            </div>
          </div>

          ${report.competitors && report.competitors.length > 0 ? `
            <div style="margin: 24px 0;">
              <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${t.topCompetitors}</h3>
              <ul style="padding: 0; margin: 0; list-style: none;">
                ${report.competitors.slice(0, 5).map(c => `
                  <li style="padding: 8px 0; border-bottom: 1px dashed #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #475569; font-size: 14px;">${c.name}</span>
                    <span style="font-weight: 600; color: #ca8a04; font-size: 14px;">★ ${c.rating || '-'}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="font-size: 14px; color: #334155;">
            ${formattedAnalysis}
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://competitorwatcher.pt/dashboard" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${t.viewOnline}</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Competitor Watcher. ${t.footer}</p>
        </div>
      </div>
    </div>
  `;

  return {
    html,
    text: t.text,
    subject: t.subject
  };
}


// Helper for weekly report
export function generateWeeklyReportContent(user: User, reports: Report[]) {
  const lang = user.language || "pt";
  const normalizedLang = lang.substring(0, 2).toLowerCase();

  const translations: Record<string, any> = {
    pt: {
      subject: "Relatório Semanal de Concorrência",
      title: "O Seu Resumo Semanal",
      intro: `Aqui está a análise semanal para os seus <strong>${reports.length} negócios</strong>.`,
      viewFullReport: "Ver Relatório Completo",
      competitors: "concorrentes",
      rating: "avaliação média",
      dashboardButton: "Ir para o Dashboard",
      footer: "Todos os direitos reservados.",
      noChanges: "Sem alterações significativas esta semana."
    },
    en: {
      subject: "Weekly Competitor Analysis Report",
      title: "Your Weekly Summary",
      intro: `Here is the weekly analysis for your <strong>${reports.length} businesses</strong>.`,
      viewFullReport: "View Full Report",
      competitors: "competitors",
      rating: "avg rating",
      dashboardButton: "Go to Dashboard",
      footer: "All rights reserved.",
      noChanges: "No significant changes this week."
    },
    es: {
      subject: "Informe Semanal de Competencia",
      title: "Su Resumen Semanal",
      intro: `Aquí tiene el análisis semanal para sus <strong>${reports.length} negocios</strong>.`,
      viewFullReport: "Ver Informe Completo",
      competitors: "competidores",
      rating: "calificación media",
      dashboardButton: "Ir al Panel",
      footer: "Todos los derechos reservados.",
      noChanges: "Sin cambios significativos esta semana."
    },
    fr: {
      subject: "Rapport Hebdomadaire de Concurrence",
      title: "Votre Résumé Hebdomadaire",
      intro: `Voici l'analyse hebdomadaire pour vos <strong>${reports.length} entreprises</strong>.`,
      viewFullReport: "Voir le Rapport Complet",
      competitors: "concurrents",
      rating: "note moyenne",
      dashboardButton: "Accéder au Tableau de Bord",
      footer: "Tous droits réservés.",
      noChanges: "Aucun changement significatif cette semaine."
    },
    de: {
      subject: "Wöchentlicher Wettbewerbsbericht",
      title: "Ihre Wöchentliche Zusammenfassung",
      intro: `Hier ist die wöchentliche Analyse für Ihre <strong>${reports.length} Unternehmen</strong>.`,
      viewFullReport: "Vollständigen Bericht ansehen",
      competitors: "Wettbewerber",
      rating: "Durchschnittsbewertung",
      dashboardButton: "Zum Dashboard gehen",
      footer: "Alle Rechte vorbehalten.",
      noChanges: "Keine wesentlichen Änderungen diese Woche."
    }
  };

  const t = translations[normalizedLang] || translations.en;

  let reportsHtml = "";

  for (const report of reports) {
    const avgRating = report.competitors && report.competitors.length > 0
      ? (report.competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / report.competitors.length).toFixed(1)
      : "-";

    const ratingColor = avgRating !== "-" && parseFloat(avgRating) >= 4.0 ? "#16a34a" : "#ca8a04";

    reportsHtml += `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
             <h3 style="color: #1e293b; margin: 0; font-size: 18px; font-weight: 700;">${report.businessName}</h3>
             <span style="background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                ${new Date(report.generatedAt).toLocaleDateString()}
             </span>
          </div>
          
          <div style="display: flex; gap: 24px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
              <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 24px; font-weight: 800; color: #0f172a;">${report.competitors?.length || 0}</span>
                  <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${t.competitors}</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 24px; font-weight: 800; color: ${ratingColor};">${avgRating}</span>
                  <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${t.rating}</span>
              </div>
          </div>
          
          <div style="font-size: 15px; color: #475569; margin-bottom: 20px; line-height: 1.6;">
              ${report.executiveSummary || t.noChanges}
          </div>

          <div style="text-align: right;">
              <a href="https://competitorwatcher.pt/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center;">
                 ${t.viewFullReport} <span style="margin-left: 4px;">&rarr;</span>
              </a>
          </div>
      </div>
    `;
  }

  const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
      <div style="max-width: 680px; margin: 0 auto;">
        
        <!-- Brand Header -->
        <div style="text-align: center; margin-bottom: 32px;">
           <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Competitor Watcher</h1>
        </div>
        
        <!-- Main Card -->
        <div style="background-color: transparent;">
          <h2 style="color: #334155; margin-top: 0; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 8px;">${t.title}</h2>
          <p style="color: #64748b; line-height: 1.6; margin-bottom: 32px; text-align: center; font-size: 16px;">${t.intro}</p>
          
          ${reportsHtml}
          
          <!-- Primary Action -->
          <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
             <a href="https://competitorwatcher.pt/dashboard" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: background-color 0.2s;">
                ${t.dashboardButton}
             </a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
             <p style="color: #94a3b8; font-size: 13px; margin: 0;">&copy; ${new Date().getFullYear()} Competitor Watcher. ${t.footer}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    html: html,
    text: `${t.title}\n${t.intro}\n\n${reports.map(r => `${r.businessName} (${r.competitors?.length || 0} competitors, ${r.executiveSummary})`).join('\n\n')}`,
    subject: t.subject
  };
}

// Standalone sender for password resets etc.
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  // Use Resend if available
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || "Competitor Watcher <noreply@competitorwatcher.pt>";

      const data = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text
      });

      if (data.error) {
        console.error("[Resend] Failed to send email:", data.error);
        // Fallback to Nodemailer if needed, or throw
        // For now, let's treat it as a hard failure unless we want dual redundancy
        throw new Error(data.error.message);
      }

      log(`[Resend] Email sent to ${to}: ${data.data?.id}`, "email");
      return true;
    } catch (error) {
      console.error("[Resend] Error:", error);
      throw error;
    }
  }

  // Fallback to Nodemailer logic
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || (user ? `Competitor Watcher <${user}>` : '"Competitor Watcher" <noreply@competitorwatcher.pt>');

  if (service || host) {
    log(`Attempting to send email via ${service ? `service: ${service}` : `host: ${host}`} to ${to}...`, "email");

    // ... config same as before ...
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
    const secure = (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === "true";

    const config: any = {
      auth: { user, pass },
      host,
      port,
      secure,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000
    };

    if (service) {
      delete config.host;
      delete config.port;
      delete config.secure;
      config.service = service;
    }

    try {
      const transporter = nodemailer.createTransport(config);
      const info = await transporter.sendMail({ from, to, subject, html, text });
      log(`✅ Success! Message sent: ${info.messageId}`, "email");
    } catch (error) {
      log(`❌ Failed to send email to ${to}: ${error}`, "email");
      throw error;
    }
  } else {
    console.log(`[EMAIL MOCK] Sending email to ${to} (Content suppressed)`);
  }
  return true;
}

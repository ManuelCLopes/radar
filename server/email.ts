import nodemailer from "nodemailer";
import { Resend } from "resend";
import { Report, User } from "@shared/schema";
import { log } from "./log";

export interface EmailService {
  sendWeeklyReport(user: User, report: Report): Promise<boolean>;
  sendAdHocReport(to: string, report: Report, lang: string): Promise<boolean>;
}

export class ConsoleEmailService implements EmailService {
  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    console.log(`[EMAIL MOCK] Sending email to ${user.email} (Content suppressed)`);
    return true;
  }

  async sendAdHocReport(to: string, report: Report, lang: string): Promise<boolean> {
    console.log(`[EMAIL MOCK] Sending ad-hoc email to ${to} (Content suppressed)`);
    return true;
  }
}

export class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
    log("[EmailService] Initialized with Resend API", "email");
  }

  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    try {
      const { html, text, subject } = generateWeeklyReportContent(user, report);
      const from = process.env.EMAIL_FROM || "Competitive Watcher <onboarding@resend.dev>";

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
    try {
      const { html, text, subject } = generateReportEmail(report, lang);
      const from = process.env.EMAIL_FROM || "Competitive Watcher <onboarding@resend.dev>";

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

  async sendWeeklyReport(user: User, report: Report): Promise<boolean> {
    try {
      const { html, text, subject } = generateWeeklyReportContent(user, report);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitive Watcher" <noreply@competitivewatcher.pt>',
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
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Competitive Watcher" <noreply@competitivewatcher.pt>',
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
      message: `Recebemos um pedido para repor a palavra-passe da sua conta <strong>${email}</strong> no Competitive Watcher.`,
      instruction: "Clique no botão abaixo para escolher uma nova palavra-passe:",
      button: "Repor Palavra-passe",
      disclaimer: "Este link irá expirar em 15 minutos. Se não solicitou esta alteração, pode ignorar este email com segurança.",
      footer: "Todos os direitos reservados.",
      text: `Olá, recupere a sua palavra-passe aqui: ${resetLink}. O link expira em 15 minutos.`
    },
    en: {
      title: "Reset Your Password",
      greeting: "Hello,",
      message: `We received a request to reset the password for your Competitive Watcher account associated with <strong>${email}</strong>.`,
      instruction: "Click the button below to choose a new password:",
      button: "Reset Password",
      disclaimer: "This link will expire in 15 minutes. If you didn't request this change, you can safely ignore this email.",
      footer: "All rights reserved.",
      text: `Hello, reset your password here: ${resetLink}. Link expires in 15 minutes.`
    },
    es: {
      title: "Restablecer contraseña",
      greeting: "Hola,",
      message: `Hemos recibido uma solicitud para restablecer la contraseña de su cuenta de Competitive Watcher asociada con <strong>${email}</strong>.`,
      instruction: "Haga clic en el botón de abajo para elegir una nueva contraseña:",
      button: "Restablecer contraseña",
      disclaimer: "Este enlace caducará en 15 minutos. Si no solicitó este cambio, pode ignorar este correo electrónico de forma segura.",
      footer: "Todos los derechos reservados.",
      text: `Hola, restablezca su contraseña aquí: ${resetLink}. El enlace caduca en 15 minutos.`
    },
    fr: {
      title: "Réinitialiser votre mot de passe",
      greeting: "Bonjour,",
      message: `Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Competitive Watcher associé à <strong>${email}</strong>.`,
      instruction: "Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :",
      button: "Réinitialiser le mot de passe",
      disclaimer: "Ce lien expirera dans 15 minutes. Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité.",
      footer: "Tous droits réservés.",
      text: `Bonjour, réinitialisez votre mot de passe ici : ${resetLink}. Le lien expire en 15 minutes.`
    },
    de: {
      title: "Passwort zurücksetzen",
      greeting: "Hallo,",
      message: `Wir haben eine Anfrage zum Zurücksetzen des Passworts für Ihr Competitive Watcher-Konto erhalten, das mit <strong>${email}</strong> verknüpft ist.`,
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
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitive Watcher</h1>
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
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitive Watcher. ${t.footer}</p>
        </div>
      </div>
    </div>
  `;
  return { html, text: t.text };
}

export function generateWelcomeEmail(name: string, lang: string = "pt") {
  const translations: Record<string, any> = {
    pt: {
      title: "Bem-vindo ao Competitive Watcher! 🎉",
      greeting: name ? `Olá ${name},` : "Olá,",
      message: "Obrigado por se registar no Competitive Watcher. Estamos entusiasmados por o ajudar a acompanhar os seus concorrentes e a fazer crescer o seu negócio.",
      action: "Comece por adicionar o seu primeiro negócio ao painel de controlo.",
      button: "Ir para o Painel",
      footer: "Todos os direitos reservados.",
      text: `Bem-vindo ao Competitive Watcher, ${name || "lá"}! Estamos entusiasmados por tê-lo connosco.`
    },
    en: {
      title: "Welcome to Competitive Watcher! 🎉",
      greeting: name ? `Hello ${name},` : "Hello,",
      message: "Thank you for signing up for Competitive Watcher. We're excited to help you track your competitors and grow your business.",
      action: "Get started by adding your first business to your dashboard.",
      button: "Go to Dashboard",
      footer: "All rights reserved.",
      text: `Welcome to Competitive Watcher, ${name || "there"}! We're excited to have you with us.`
    },
    es: {
      title: "¡Bienvenido a Competitive Watcher! 🎉",
      greeting: name ? `Hola ${name},` : "Hola,",
      message: "Gracias por registrarte en Competitive Watcher. Estamos emocionados de ayudarte a rastrear a tus competidores y hacer crecer tu negocio.",
      action: "Comience agregando su primer negocio a su panel de control.",
      button: "Ir al Panel",
      footer: "Todos los derechos reservados.",
      text: `¡Bienvenido a Competitive Watcher! Estamos emocionados de tenerte con nosotros.`
    },
    fr: {
      title: "Bienvenue sur Competitive Watcher ! 🎉",
      greeting: name ? `Bonjour ${name},` : "Bonjour,",
      message: "Merci de vous être inscrit sur Competitive Watcher. Nous sommes ravis de vous aider à suivre vos concurrents et à développer votre entreprise.",
      action: "Commencez par ajouter votre première entreprise à votre tableau de bord.",
      button: "Accéder au tableau de bord",
      footer: "Tous droits réservés.",
      text: `Bienvenue sur Competitive Watcher ! Nous sommes ravis de vous avoir parmi nous.`
    },
    de: {
      title: "Willkommen bei Competitive Watcher! 🎉",
      greeting: name ? `Hallo ${name},` : "Hallo,",
      message: "Vielen Dank für Ihre Anmeldung bei Competitive Watcher. Wir freuen uns, Ihnen dabei zu helfen, Ihre Wettbewerber zu verfolgen und Ihr Geschäft auszubauen.",
      action: "Beginnen Sie, indem Sie Ihr erstes Unternehmen zu Ihrem Dashboard hinzufügen.",
      button: "Zum Dashboard gehen",
      footer: "Alle Rechte vorbehalten.",
      text: `Willkommen bei Competitive Watcher, ${name || "dort"}! Wir freuen uns, Sie dabei zu haben.`
    }
  };

  const normalizedLang = lang.substring(0, 2).toLowerCase();
  const t = translations[normalizedLang] || translations.en;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitive Watcher</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${t.title}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${t.greeting},</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.message}</p>
          <p style="color: #4b5563; line-height: 1.6;">${t.action}</p>
          <div style="margin: 35px 0; text-align: center;">
            <a href="https://competitivewatcher.pt/dashboard" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${t.button}</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Competitive Watcher. ${t.footer}</p>
        </div>
      </div>
    </div>
  `;
  return { html, text: t.text };
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

  const formattedAnalysis = report.aiAnalysis
    .replace(/<h2/g, '<h2 style="color: #1e3a8a; font-size: 18px; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;"')
    .replace(/<h3/g, '<h3 style="color: #1e40af; font-size: 16px; margin-top: 16px;"')
    .replace(/<ul/g, '<ul style="padding-left: 20px; margin-bottom: 16px;"')
    .replace(/<li/g, '<li style="margin-bottom: 8px;"')
    .replace(/<p/g, '<p style="margin-bottom: 12px; line-height: 1.6;"');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; color: #334155;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 20px;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Competitive Watcher</h1>
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
            <a href="https://competitivewatcher.pt/dashboard" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${t.viewOnline}</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Competitive Watcher. ${t.footer}</p>
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


// Helper for weekly report (kept at bottom or where preferred)
function generateWeeklyReportContent(user: User, report: Report) {
  const lang = user.language || "pt";
  const translations: Record<string, any> = {
    pt: {
      subject: `Relatório Semanal - Competitive Watcher: ${report.businessName}`,
      title: "Análise Semanal de Concorrência",
      message: `Aqui está o seu relatório semanal de análise de concorrência para <strong>${report.businessName}</strong>.`,
      detail: "Analisámos as críticas e tendências mais recentes na sua área.",
      button: "Ver Relatório Completo",
      footer: `Gerado em ${new Date(report.generatedAt).toLocaleString('pt-PT')}`
    },
    en: {
      subject: `Weekly Report - Competitive Watcher: ${report.businessName}`,
      title: "Weekly Competitor Analysis",
      message: `Here is your weekly competitor analysis report for <strong>${report.businessName}</strong>.`,
      detail: "We've analyzed the latest reviews and trends in your area.",
      button: "View Full Report",
      footer: `Generated at ${new Date(report.generatedAt).toLocaleString('en-US')}`
    },
    es: {
      subject: `Informe Semanal - Competitive Watcher: ${report.businessName}`,
      title: "Análisis Semanal de Competencia",
      message: `Aquí está su informe semanal de análisis de competencia para <strong>${report.businessName}</strong>.`,
      detail: "Hemos analizado las críticas y tendencias más recientes en su área.",
      button: "Ver Informe Completo",
      footer: `Generado el ${new Date(report.generatedAt).toLocaleString('es-ES')}`
    },
    fr: {
      subject: `Rapport Hebdomadaire - Competitive Watcher : ${report.businessName}`,
      title: "Analyse Hebdomadaire de la Concurrence",
      message: `Voici votre rapport hebdomadaire d'analyse de la concurrence pour <strong>${report.businessName}</strong>.`,
      detail: "Nous avons analysé les derniers avis et tendances dans votre région.",
      button: "Voir le Rapport Complet",
      footer: `Généré le ${new Date(report.generatedAt).toLocaleString('fr-FR')}`
    },
    de: {
      subject: `Wöchentlicher Bericht - Competitive Watcher: ${report.businessName}`,
      title: "Wöchentliche Wettbewerbsanalyse",
      message: `Hier ist Ihr wöchentlicher Wettbewerbsanalysebericht für <strong>${report.businessName}</strong>.`,
      detail: "Wir haben die neuesten Bewertungen und Trends in Ihrer Region analysiert.",
      button: "Vollständigen Bericht anzeigen",
      footer: `Generiert am ${new Date(report.generatedAt).toLocaleString('de-DE')}`
    }
  };

  const normalizedLang = lang.substring(0, 2).toLowerCase();
  const t = translations[normalizedLang] || translations.en;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #0a58ca; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Competitive Watcher</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${t.title}</h2>
        <p style="color: #4b5563; line-height: 1.6;">${t.message}</p>
        <p style="color: #4b5563; line-height: 1.6;">${t.detail}</p>
        <div style="margin: 35px 0; text-align: center;">
          <a href="https://competitivewatcher.pt/dashboard" style="background-color: #0a58ca; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${t.button}</a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          ${t.footer}
        </p>
      </div>
    </div>
  `;

  return { html, text: t.message, subject: t.subject };
}

// Standalone sender for password resets etc.
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  // Use Resend if available
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || "Competitive Watcher <onboarding@resend.dev>";

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
      // Fallback could go here... but let's stick to one path for now
      throw error;
    }
  }

  // Fallback to Nodemailer logic
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || (user ? `Competitive Watcher <${user}>` : '"Competitive Watcher" <noreply@competitivewatcher.pt>');

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

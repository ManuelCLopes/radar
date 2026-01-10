
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testEmailConnection() {
    console.log("-----------------------------------------");
    console.log("📧 Testing Email Connection");
    console.log("-----------------------------------------");

    const service = process.env.EMAIL_SERVICE;
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const portEnv = process.env.EMAIL_PORT || process.env.SMTP_PORT;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const secureEnv = process.env.EMAIL_SECURE || process.env.SMTP_SECURE;
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || `Radar <${user}>`;

    // Determine configuration
    const config: any = {
        auth: { user, pass }
    };

    if (service) {
        config.service = service;
        console.log(`Using Service: ${service}`);
    } else {
        // Auto-configure for Gmail if detected
        const isGmail = host === "smtp.gmail.com";
        const defaultPort = isGmail ? 465 : 587;
        const defaultSecure = isGmail ? true : false;

        config.host = host;
        config.port = portEnv ? parseInt(portEnv) : defaultPort;
        config.secure = secureEnv ? secureEnv === "true" : defaultSecure;

        console.log(`Using Host: ${config.host}`);
        console.log(`Using Port: ${config.port}`);
        console.log(`Using Secure: ${config.secure}`);
    }

    console.log(`User: ${user}`);
    console.log(`Pass: ${pass ? "********" : "NOT SET"}`);
    console.log("-----------------------------------------");

    if (!user || !pass) {
        console.error("❌ Error: EMAIL_USER or EMAIL_PASS not set in .env");
        process.exit(1);
    }

    try {
        const transporter = nodemailer.createTransport(config);

        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection verified successfully!");

        console.log(`Attempting to send test email to ${user}...`);
        const info = await transporter.sendMail({
            from,
            to: user, // Send to self
            subject: "Radar Test Email",
            text: "If you are reading this, your email configuration is working correctly!",
            html: "<p>If you are reading this, your <b>email configuration</b> is working correctly!</p>"
        });

        console.log("✅ Message sent: %s", info.messageId);
        console.log("-----------------------------------------");
        console.log("Test passed!");

    } catch (error: any) {
        console.error("❌ Connection Failed:");
        console.error(error);
        console.log("-----------------------------------------");
        console.log("Troubleshooting Tips:");

        if (error.code === 'EAUTH') {
            console.log("- Check your EMAIL_USER and EMAIL_PASS.");
            console.log("- If using Gmail, make sure you are using an APP PASSWORD, not your login password.");
        } else if (error.code === 'ETIMEDOUT') {
            console.log("- Connection timed out. Check if the port and host are correct.");
            console.log("- Try using port 465 with secure: true.");
        } else {
            console.log("- Check your internet connection.");
            console.log("- Verify firewall settings.");
        }
        process.exit(1);
    }
}

testEmailConnection();

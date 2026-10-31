import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { emailDelivery, EmailDeliveryError } from "./email-delivery";

interface SendOTPOptions {
  email: string;
  otp: string;
  type:
    | "sign-in"
    | "email-verification"
    | "forget-password"
    | "change-email"
    | string;
}

/**
 * Send authentication email through the dedicated Gmail SMTP account.
 */
export async function sendVerificationOTPEmail({
  email,
  otp,
  type,
}: SendOTPOptions): Promise<void> {
  const user = process.env.GMAIL_SMTP_USER?.trim();
  const password = process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, "");
  const from = { name: "ContextGraph", address: user || "" };

  let subject = `Your ContextGraph verification code`;
  let headline = "Verify your email address";
  let subtext =
    "Enter the 6-digit verification code below to confirm your email and secure your context graph.";

  if (type === "sign-in") {
    subject = `Your ContextGraph sign-in code`;
    headline = "Sign in to ContextGraph";
    subtext =
      "Enter the 6-digit code below to securely sign in to your context graph.";
  } else if (type === "forget-password") {
    subject = `Set your ContextGraph password`;
    headline = "Verify your email";
    subtext =
      "Enter this code to verify your email and choose your ContextGraph password.";
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ededed;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0d0e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #131618; border: 1px solid #23272b; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1e2226;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #1a1e22; border: 1px solid #2c3238; border-radius: 6px; width: 32px; height: 32px; text-align: center; vertical-align: middle;">
                    <span style="color: #B3EC13; font-weight: 800; font-size: 16px;">⬡</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">Context<span style="color: #B3EC13;">Graph</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                ${headline}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #9da6b0;">
                ${subtext}
              </p>
              <div style="background-color: #171b1e; border: 1px solid #282f36; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #B3EC13;">
                  ${otp}
                </span>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #6b7580;">
                This code expires in <strong>5 minutes</strong>. If you did not request this verification code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 32px; background-color: #0e1012; border-top: 1px solid #1c2024; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #525a63;">
                ContextGraph · Cross-AI Personal Context Engine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `${headline}\n\n${subtext}\n\nYour verification code: ${otp}\n\nThis code expires in 5 minutes.\nIf you did not request this, please ignore this email.\n\nContextGraph`;

  const reference = randomUUID();
  try {
    const testPort = process.env.GMAIL_SMTP_TEST_PORT;
    const testMode =
      !!testPort &&
      !process.env.VERCEL &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        process.env.BETTER_AUTH_URL || "",
      );
    if (!user || !password || !/^[^\s@]+@gmail\.com$/i.test(user))
      throw new EmailDeliveryError();
    if (testPort && !testMode) throw new EmailDeliveryError();
    const transport = nodemailer.createTransport({
      host: testMode ? "127.0.0.1" : "smtp.gmail.com",
      port: testMode ? Number(testPort) : 465,
      secure: !testMode,
      ...(testMode ? { ignoreTLS: true } : { auth: { user, pass: password } }),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      logger: false,
      debug: false,
    });
    const sent = await transport.sendMail({
      from,
      to: email,
      subject,
      html,
      text,
    });
    if (sent.rejected?.length) throw new EmailDeliveryError();
    console.info("[email]", { event: "smtp_accepted", reference, type });
  } catch (error) {
    const state = emailDelivery.getStore();
    if (state) state.failed = true;
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "CONFIG_OR_DELIVERY";
    const safeCode = [
      "EAUTH",
      "ECONNECTION",
      "ETIMEDOUT",
      "ESOCKET",
      "EENVELOPE",
    ].includes(code)
      ? code
      : "DELIVERY_FAILED";
    console.error("[email]", {
      event: "smtp_failed",
      reference,
      code: safeCode,
    });
    throw new EmailDeliveryError();
  }
}

// Explicit operator command. Never run automatically during builds or deployment.
import { randomInt } from "node:crypto";
import { sendVerificationOTPEmail } from "../lib/email";
const args = process.argv.slice(2);
const to = args.includes("--self")
  ? process.env.GMAIL_SMTP_USER
  : args[args.indexOf("--to") + 1];
if (
  (!args.includes("--to") && !args.includes("--self")) ||
  !to ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
) {
  console.error(
    "Usage: node --env-file=.env.local --import tsx scripts/check-email.mts --self (or --to recipient@example.com)",
  );
  process.exit(1);
}
try {
  await sendVerificationOTPEmail({
    email: to,
    otp: String(randomInt(100000, 1000000)),
    type: "email-verification",
  });
  console.log(
    "SMTP accepted the test email. Check the recipient inbox/spam folder. This test does not create an account or usable account-verification code.",
  );
} catch {
  console.error(
    "SMTP check failed. Check sanitized [email] diagnostics and the setup guide. No credentials are printed.",
  );
  process.exitCode = 1;
}

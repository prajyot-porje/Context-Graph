import { randomBytes } from "node:crypto";
import { z } from "zod";
import { auth } from "./auth";
import { getBaseUrl } from "./auth-url";
import {
  authIdentity,
  authRequestIdentity,
  limitAuth,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./auth-policy";
import { DataError, withAuthIdentityLock } from "./db";
import { emailDelivery, EmailDeliveryError } from "./email-delivery";
import { AuthBodyTooLarge, readAuthBody } from "./api/auth-body";

const bodySchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.trim().toLowerCase()),
    mode: z.enum(["signup", "recovery"]).optional(),
    otp: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .max(PASSWORD_MAX_LENGTH)
      .optional(),
  })
  .strict();

export async function handleAuthFlow(
  request: Request,
  action: string,
): Promise<Response> {
  const respond = (
    body: object,
    status = 200,
    headers: Record<string, string> = {},
  ) =>
    Response.json(body, {
      status,
      headers: { "Cache-Control": "no-store", ...headers },
    });
  try {
    const origin = request.headers.get("origin");
    const expectedOrigin = new URL(getBaseUrl()).origin;
    if (!origin || origin !== expectedOrigin)
      return respond({ error: "Refresh this page and try again." }, 403);
    if (!["send", "check", "complete"].includes(action))
      return respond({ error: "Not found" }, 404);
    const parsed = bodySchema.safeParse(await readAuthBody(request));
    if (!parsed.success)
      return respond(
        {
          error:
            "Check your email, code and password. Use a password of 12–128 characters.",
        },
        400,
      );
    const { email, mode, otp, password } = parsed.data;
    const ip = authRequestIdentity(request);
    const ipLimit = await limitAuth(`flow:ip:${ip}`, 600, 200);
    if (!ipLimit.allowed)
      return respond(
        { error: "Too many requests. Please try again later." },
        429,
        { "Retry-After": String(ipLimit.retryAfter) },
      );

    if (action === "send") {
      if (!mode) return respond({ error: "Choose signup or recovery." }, 400);
      // Shared across signup/recovery and instances; denied sends never reach SMTP.
      for (const [key, seconds, max] of [
        [`send:cooldown:${email}`, 60, 1],
        [`send:recipient:${email}`, 900, 5],
        [`send:ip:${ip}`, 3600, 50],
        ["send:global", 86400, 300],
      ] as const) {
        const budget = await limitAuth(key, seconds, max);
        if (!budget.allowed)
          return respond(
            { error: "Please wait before requesting another code." },
            429,
            { "Retry-After": String(budget.retryAfter) },
          );
      }
      if (mode === "signup") {
        // Never accept a password before proof. Duplicate signup is deliberately
        // generic, and final reset replaces any pre-registration credential.
        await auth.api.signUpEmail({
          body: {
            email,
            name: email.split("@")[0].slice(0, 64) || "Member",
            password: randomBytes(32).toString("base64url"),
          },
        });
      }
      const state = { failed: false };
      await emailDelivery.run(state, () =>
        auth.api.requestPasswordResetEmailOTP({ body: { email } }),
      );
      if (state.failed) throw new EmailDeliveryError();
      return respond({
        success: true,
        message:
          "If this email is eligible, a code has been sent. It expires in 5 minutes.",
      });
    }
    if (!otp) return respond({ error: "Enter the six-digit code." }, 400);
    const budget = await limitAuth(`proof:${email}`, 300, 10);
    if (!budget.allowed)
      return respond(
        { error: "Too many attempts. Wait before trying again." },
        429,
        { "Retry-After": String(budget.retryAfter) },
      );
    if (action === "check") {
      await auth.api.checkVerificationOTP({
        body: { email, otp, type: "forget-password" },
      });
      return respond({ success: true });
    }
    if (!password)
      return respond({ error: "Choose a password of 12–128 characters." }, 400);
    // The preliminary check is UX only: this operation revalidates and consumes
    // the one-time proof inside Better Auth's credential/revocation transaction.
    await withAuthIdentityLock(authIdentity(`credential:${email}`), () =>
      auth.api.resetPasswordEmailOTP({ body: { email, otp, password } }),
    );
    return respond({ success: true });
  } catch (error) {
    if (error instanceof DataError)
      return respond({ error: error.message }, error.status);
    if (error instanceof AuthBodyTooLarge)
      return respond({ error: "Request too large" }, 413);
    if (error instanceof EmailDeliveryError)
      return respond({ error: error.message }, 503);
    if (error instanceof SyntaxError)
      return respond({ error: "Invalid request." }, 400);
    const code =
      typeof error === "object" && error && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    if (code >= 400 && code < 500)
      return respond(
        {
          error:
            "The code is invalid, expired, or has too many attempts. Request a new code if needed.",
        },
        400,
      );
    console.error("[auth-flow]", {
      event: "request_failed",
      type: error instanceof Error ? error.name : "Unknown",
    });
    return respond(
      {
        error:
          "Authentication is temporarily unavailable. Please try again later.",
      },
      503,
    );
  }
}

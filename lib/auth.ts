import { betterAuth } from "better-auth";
import { emailOTP, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { database } from "./database";
import { sendVerificationOTPEmail } from "@/lib/email";
import { getBaseUrl } from "./auth-url";
import {
  limitAuth,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  trustedAuthOrigins,
} from "./auth-policy";
import { finishPasswordRecovery } from "./db";
export { getBaseUrl } from "./auth-url";

export const auth = betterAuth({
  logger: {
    level: "warn",
    log(level, message) {
      // Provider messages/arguments may contain emails, tokens or raw upstream
      // errors. Publish only bounded categories; SMTP has separate references.
      const event = message.toLowerCase().includes("schema")
        ? "schema_check"
        : message.toLowerCase().includes("background")
          ? "background_task"
          : "provider_event";
      console.warn("[auth]", { level, event });
    },
  },
  basePath: "/api/auth",
  baseURL: getBaseUrl(),
  trustedOrigins: trustedAuthOrigins(),
  database,
  disabledPaths: [
    "/sign-up/email",
    "/verify-email",
    "/send-verification-email",
    "/email-otp/verify-email",
    "/email-otp/send-verification-otp",
    "/email-otp/check-verification-otp",
    "/sign-in/email-otp",
    "/email-otp/request-password-reset",
    "/forget-password/email-otp",
    "/email-otp/reset-password",
    "/request-password-reset",
    "/reset-password",
  ],
  rateLimit: {
    enabled: true,
    customStorage: {
      consume: (key, rule) =>
        limitAuth(`provider:${key}`, rule.window, rule.max),
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => finishPasswordRecovery(user.id),
  },
  emailVerification: {
    autoSignInAfterVerification: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
    },
  },
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: "/oauth/login",
      consentPage: "/oauth/consent",
      scopes: [
        "openid",
        "profile",
        "offline_access",
        "context:read",
        "context:write",
      ],
      resources: [
        {
          identifier: `${getBaseUrl()}/api/mcp`,
          allowedScopes: ["context:read", "context:write", "offline_access"],
        },
      ],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultResources: [`${getBaseUrl()}/api/mcp`],
      grantTypes: ["authorization_code", "refresh_token"],
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendVerificationOTPEmail({ email, otp, type });
      },
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOnSignUp: false,
      storeOTP: "hashed",
      allowedAttempts: 3,
      disableSignUp: true,
    }),
  ],
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        },
      }
    : {}),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if >1 day old
    cookieCache: {
      enabled: false,
    },
  },
  user: {
    additionalFields: {
      onboarding_done: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
});

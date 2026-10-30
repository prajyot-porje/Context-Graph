import { betterAuth } from 'better-auth'
import { emailOTP, jwt } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { database } from './database'
import { sendVerificationOTPEmail } from '@/lib/email'
import {getBaseUrl} from './auth-url'
export {getBaseUrl} from './auth-url'

export const auth = betterAuth({
  basePath: '/api/auth',
  baseURL: getBaseUrl(),
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://*.vercel.app',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ],
  database,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      requireLocalEmailVerified: false,
    },
  },
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: '/oauth/login',
      consentPage: '/oauth/consent',
      scopes: ['openid', 'profile', 'offline_access', 'context:read', 'context:write'],
      resources: [{ identifier: `${getBaseUrl()}/api/mcp`, allowedScopes: ['context:read', 'context:write', 'offline_access'] }],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultResources: [`${getBaseUrl()}/api/mcp`],
      grantTypes: ['authorization_code', 'refresh_token'],
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendVerificationOTPEmail({ email, otp, type })
      },
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOnSignUp: true,
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
    expiresIn: 60 * 60 * 24 * 7,       // 7 days
    updateAge: 60 * 60 * 24,            // refresh if >1 day old
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      onboarding_done: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
})

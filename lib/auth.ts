import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import { Pool } from 'pg'
import { sendVerificationOTPEmail } from '@/lib/email'

function getBaseUrl(): string {
  let url = 'http://localhost:3000'
  // 1. On Vercel Preview deployments, use the dynamic deployment preview URL
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`
  } else if (process.env.BETTER_AUTH_URL) {
    // 2. Explicitly configured BETTER_AUTH_URL
    url = process.env.BETTER_AUTH_URL
  } else if (process.env.VERCEL_URL) {
    // 3. Fallback to VERCEL_URL if set
    url = `https://${process.env.VERCEL_URL}`
  }
  return url.replace(/\/+$/, '')
}

export const auth = betterAuth({
  baseURL: getBaseUrl(),
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://*.vercel.app',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ],
  database: new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.SUPABASE_DATABASE_URL?.includes('supabase.com')
      ? { rejectUnauthorized: false }
      : undefined,
  }),
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

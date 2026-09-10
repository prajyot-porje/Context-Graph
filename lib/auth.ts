import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'
import { Pool } from 'pg'
import { sendVerificationOTPEmail } from '@/lib/email'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
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

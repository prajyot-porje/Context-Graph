'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, authClient } from '@/lib/auth-client'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { GoogleIcon } from '@/components/auth/GoogleIcon'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Loader2, ArrowRight, Mail, ArrowLeft } from 'lucide-react'

export default function LoginClient() {
  const router = useRouter()
  const [step, setStep] = useState<'login' | 'verify'>('login')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  // Validation & status
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)

  const otpInputRef = useRef<HTMLInputElement>(null)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Focus OTP input when switching to verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => otpInputRef.current?.focus(), 100)
    }
  }, [step])

  const handleGoogle = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      await signIn.social({ provider: 'google', callbackURL: '/dashboard' })
    } catch {
      setError('Failed to initialize Google sign in. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanEmail = email.trim().toLowerCase()

    // Client-side validation
    const newErrors: typeof errors = {}
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      newErrors.email = 'Please enter a valid email address.'
    }
    if (!password) {
      newErrors.password = 'Please enter your password.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.email({
        email: cleanEmail,
        password,
      })

      setIsLoading(false)

      if (result.error) {
        // 1. If email is unverified, automatically dispatch code and move to OTP screen
        if (
          result.error.code === 'EMAIL_NOT_VERIFIED' ||
          result.error.message?.toLowerCase().includes('not verified')
        ) {
          try {
            await authClient.emailOtp.sendVerificationOtp({
              email: cleanEmail,
              type: 'email-verification',
            })
            setResendCooldown(60)
          } catch {
            // ignore pre-send error
          }
          setStep('verify')
          setError('')
          return
        }

        // 2. Query account status to clearly distinguish invalid email vs invalid password vs Google auth
        try {
          const checkRes = await fetch('/api/auth/check-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          })

          if (checkRes.ok) {
            const { status } = await checkRes.json()

            if (!status.exists) {
              setError('No account found with this email. Please check for typos or sign up.')
              return
            }

            if (!status.emailVerified) {
              try {
                await authClient.emailOtp.sendVerificationOtp({
                  email: cleanEmail,
                  type: 'email-verification',
                })
                setResendCooldown(60)
              } catch {
                // ignore
              }
              setStep('verify')
              setError('')
              return
            }

            if (status.hasGoogle && !status.hasPassword) {
              setError('This account was registered with Google. Please click "Continue with Google" above.')
              return
            }

            if (status.hasPassword) {
              setError('Incorrect password. Please double-check your password and try again.')
              return
            }
          }
        } catch {
          // Fallback to standard error if lookup network fails
        }

        setError('Invalid email or password. Please try again.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setIsLoading(false)
      const message = err instanceof Error ? err.message : 'An error occurred during sign in'
      setError(message)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanOtp = otp.trim().replace(/\D/g, '')
    if (cleanOtp.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit verification code.' })
      return
    }

    setErrors({})
    setIsLoading(true)
    setError('')

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      })

      setIsLoading(false)

      if (result.error) {
        if (result.error.code === 'OTP_EXPIRED') {
          setError('Verification code has expired. Please request a new code.')
        } else if (result.error.code === 'INVALID_OTP') {
          setError('Invalid verification code. Please check the code and try again.')
        } else if (result.error.code === 'TOO_MANY_ATTEMPTS') {
          setError('Too many attempts. Please request a new code.')
        } else {
          setError(result.error.message ?? 'Verification failed. Please try again.')
        }
        return
      }

      // Email verified and session active
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setIsLoading(false)
      const message = err instanceof Error ? err.message : 'Verification failed'
      setError(message)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setError('')
    setResendSuccess(false)

    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: 'email-verification',
      })

      setIsResending(false)

      if (res.error) {
        setError(res.error.message ?? 'Failed to resend verification code.')
      } else {
        setResendCooldown(60)
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 4000)
      }
    } catch {
      setIsResending(false)
      setError('Failed to resend verification code.')
    }
  }

  return (
    <AuthLayout>
      <div className="flex w-full flex-col">
        {step === 'login' ? (
          <>
            <h1 className="cg-heading mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
              Welcome back
            </h1>
            <p className="cg-subtext mb-8 text-[15px] text-[var(--text-secondary)]">
              Sign in to your context graph
            </p>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGoogle}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? <Loader2 className="animate-spin" size={16} /> : <GoogleIcon size={16} />}
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[12px] text-[var(--text-muted)]">or</span>
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="cg-field">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  disabled={isLoading}
                />
              </div>

              <div className="cg-field">
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  disabled={isLoading}
                />
              </div>

              <div className="cg-submit mt-2 w-full">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Sign in'}
                </Button>
              </div>

              {error && (
                <div className="rounded-[var(--radius-sm)] border border-[rgba(255,85,85,0.2)] bg-[rgba(255,85,85,0.08)] p-3 text-center text-[13px] text-[var(--error)]">
                  {error}
                </div>
              )}
            </form>

            <p className="cg-subtext mt-6 text-center text-[14px] text-[var(--text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[var(--accent)] transition-colors hover:underline inline-flex items-center"
              >
                Sign up <ArrowRight size={16} className="ml-1" />
              </Link>
            </p>
          </>
        ) : (
          /* Email Verification Step for unverified users trying to log in */
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                setStep('login')
                setError('')
                setErrors({})
              }}
              className="mb-4 inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>

            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
              <Mail size={18} />
            </div>

            <h1 className="cg-heading mb-2 font-display text-[32px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
              Verify your email
            </h1>
            <p className="cg-subtext mb-6 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Your email is not verified yet. We sent a 6-digit confirmation code to <span className="font-semibold text-[var(--text-primary)]">{email}</span>.
            </p>

            <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
              <div className="cg-field">
                <label className="block text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.06em] mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(val)
                    if (errors.otp) setErrors({})
                  }}
                  className="w-full h-12 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-center font-mono text-[24px] font-bold tracking-[0.35em] text-[var(--text-primary)] transition-colors duration-150 focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  disabled={isLoading}
                />
                {errors.otp && (
                  <p className="mt-1 text-[12px] text-[var(--error)]">{errors.otp}</p>
                )}
              </div>

              <div className="cg-submit mt-2 w-full">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Verify code & sign in'}
                </Button>
              </div>

              {resendSuccess && (
                <p className="rounded-[var(--radius-sm)] border border-[rgba(179,236,19,0.25)] bg-[rgba(179,236,19,0.08)] p-2.5 text-center text-[12px] font-medium text-[var(--accent)]">
                  A fresh verification code has been sent to your email.
                </p>
              )}

              {error && (
                <div className="rounded-[var(--radius-sm)] border border-[rgba(255,85,85,0.2)] bg-[rgba(255,85,85,0.08)] p-3 text-center text-[13px] text-[var(--error)]">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-6 flex flex-col items-center gap-2 border-t border-[var(--border)] pt-5 text-center text-[13px] text-[var(--text-secondary)]">
              <span>Didn&apos;t receive the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="font-medium text-[var(--accent)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
              >
                {isResending
                  ? 'Sending new code...'
                  : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

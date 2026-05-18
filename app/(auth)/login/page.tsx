'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    const newErrors: typeof errors = {}
    if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.'
    }
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)
    setError('')

    const result = await signIn.email({
      email,
      password,
    })

    setIsLoading(false)

    if (result.error) {
      setError(result.error.message ?? 'Invalid email or password')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthLayout>
      <div className="flex w-full flex-col">
        <h1 className="cg-heading mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
          Welcome back
        </h1>
        <p className="cg-subtext mb-8 text-[15px] text-[var(--text-secondary)]">
          Sign in to your context graph
        </p>

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

          <div className="cg-submit mt-6 w-full">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Sign in'}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-center text-[13px] text-[var(--error)]">
              {error}
            </p>
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
      </div>
    </AuthLayout>
  )
}

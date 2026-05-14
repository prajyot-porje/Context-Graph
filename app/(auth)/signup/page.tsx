'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    const newErrors: typeof errors = {}
    if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.'
    }
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

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <AuthLayout>
      <div className="flex w-full flex-col">
        <h1 className="cg-heading mb-2 font-display text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)]">
          Create your account
        </h1>
        <p className="cg-subtext mb-8 text-[15px] text-[var(--text-secondary)]">
          Set up your context graph in 3 minutes
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="cg-field">
            <Input
              label="Name"
              type="text"
              placeholder="Prajyot Porje"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              disabled={isLoading}
            />
          </div>

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

          <Button
            type="submit"
            variant="primary"
            className="cg-submit mt-6 w-full"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Create account'}
          </Button>
        </form>

        <p className="cg-subtext mt-6 text-center text-[14px] text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--accent)] transition-colors hover:underline"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

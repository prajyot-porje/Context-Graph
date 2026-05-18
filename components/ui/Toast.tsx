import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/gsap'

export function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!toastRef.current) return
    const el = toastRef.current

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
    } else {
      gsap.fromTo(el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'cg-spring' }
      )
    }

    const timer = setTimeout(() => {
      if (prefersReducedMotion()) {
        onClose()
      } else {
        gsap.to(el, {
          opacity: 0, y: 8, duration: 0.2, ease: 'cg-in',
          onComplete: onClose
        })
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [message, type, onClose])

  return (
    <div
      ref={toastRef}
      className="fixed bottom-6 right-6 z-[700] flex min-w-[240px] items-center gap-[10px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-raised)] px-4 py-3 shadow-[var(--shadow-lg)]"
    >
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
        type === 'success' ? 'bg-[rgba(34,197,94,0.15)] text-[var(--success)]' : 'bg-[rgba(239,68,68,0.15)] text-[var(--error)]'
      }`}>
        {type === 'success' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </div>
      <p className="font-sans text-[13px] font-medium text-[var(--text-primary)]">
        {message}
      </p>
    </div>
  )
}

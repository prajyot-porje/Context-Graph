import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  title?: string
}

export function CodeBlock({ code, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[#0D0D0D]">
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {title}
          </span>
          <button
            onClick={handleCopy}
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
            title="Copy snippet"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-5">
        <code className="font-mono text-[13px] leading-[1.6] text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
          {code}
        </code>
      </pre>
    </div>
  )
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

// ponytail: pattern list, not a secret-scanning library — catches the common, high-confidence
// cases (provider key prefixes, private key blocks, explicit password/token fields) before
// auto-captured text is persisted permanently. Not exhaustive; add patterns as real ones surface.
const SECRET_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /ghp_[a-zA-Z0-9]{30,}/g,
  /gho_[a-zA-Z0-9]{30,}/g,
  /github_pat_[a-zA-Z0-9_]{30,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /(?:password|passwd|api[_-]?key|secret|token)\s*[:=]\s*['"]?[^\s'"]{6,}['"]?/gi,
]

export function scrubSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), text)
}

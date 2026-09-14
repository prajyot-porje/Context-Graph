import { describe, it, expect, afterEach } from 'vitest'
import { scrubSecrets, getAppUrl } from './utils'

describe('scrubSecrets', () => {
  it('redacts an OpenAI-style key', () => {
    expect(scrubSecrets('my key is sk-abcdEFGH1234567890ABCD')).toBe('my key is [REDACTED]')
  })

  it('redacts a GitHub personal access token', () => {
    expect(scrubSecrets('token: ghp_' + 'a'.repeat(36))).toBe('[REDACTED]')
  })

  it('redacts an AWS access key id', () => {
    expect(scrubSecrets('AKIAABCDEFGHIJKLMNOP is my aws key')).toBe('[REDACTED] is my aws key')
  })

  it('redacts a private key block', () => {
    const block = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----'
    expect(scrubSecrets(`here: ${block}`)).toBe('here: [REDACTED]')
  })

  it('redacts explicit password/token fields', () => {
    expect(scrubSecrets('password: hunter2345')).toBe('[REDACTED]')
    expect(scrubSecrets('api_key="abcdef123456"')).toBe('[REDACTED]')
  })

  it('leaves ordinary text untouched', () => {
    const text = 'we decided to use email OTP instead of passwords'
    expect(scrubSecrets(text)).toBe(text)
  })
})

describe('getAppUrl', () => {
  const ORIGINAL_ENV = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_ENV
  })

  it('strips a trailing slash so callers never produce a double slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com/'
    expect(getAppUrl()).toBe('https://example.com')
    expect(`${getAppUrl()}/api/mcp`).toBe('https://example.com/api/mcp')
  })

  it('leaves a URL with no trailing slash unchanged', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    expect(getAppUrl()).toBe('https://example.com')
  })

  it('falls back to localhost:3000 when unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    expect(getAppUrl()).toBe('http://localhost:3000')
  })
})

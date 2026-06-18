'use client'
import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: '12px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary, var(--text-primary-dark, #F0F0F0))',
            fontFamily: 'var(--font-geist, sans-serif)',
          }}>
            Something went wrong
          </p>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary, var(--text-muted-dark, #888888))',
            maxWidth: '280px',
            lineHeight: 1.6,
            fontFamily: 'var(--font-geist, sans-serif)',
          }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-strong, var(--border-strong-dark, rgba(255,255,255,0.14)))',
              background: 'transparent',
              color: 'var(--text-primary, var(--text-primary-dark, #F0F0F0))',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'var(--font-geist, sans-serif)',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

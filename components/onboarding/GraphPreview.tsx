'use client'

import { useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import type { WizardData } from './wizard-types'

interface Props {
  data: WizardData
}

type Tier = 'root' | 'branch' | 'leaf'
interface PreviewNode { id: string; label: string; tier: Tier; x: number; y: number; r: number }

const CENTER = { x: 200, y: 160 }
const RADIUS: Record<Exclude<Tier, 'root'>, number> = { branch: 92, leaf: 130 }
const NODE_RADIUS: Record<Tier, number> = { root: 34, branch: 21, leaf: 15 }

const NODE_COLORS: Record<Tier, { fill: string; text: string }> = {
  root: { fill: 'var(--accent)', text: 'var(--on-accent)' },
  branch: { fill: 'var(--card-raised)', text: 'var(--text-primary)' },
  leaf: { fill: 'var(--card)', text: 'var(--text-secondary)' },
}

// Real facts only — no guessing from free text. A node only appears once the
// user has actually entered the data it represents.
function buildNodes(data: WizardData): PreviewNode[] {
  const satellites: { id: string; label: string; tier: Tier }[] = []

  if (data.agencyName.trim()) satellites.push({ id: 'agency', label: data.agencyName.trim(), tier: 'branch' })
  if (data.skills.length || data.stack.length) satellites.push({ id: 'skills', label: 'Skills & Stack', tier: 'branch' })
  data.projects.slice(0, 3).forEach((p, i) => {
    if (p.name.trim()) satellites.push({ id: `project-${i}`, label: p.name.trim(), tier: 'leaf' })
  })
  if (data.goals.trim()) satellites.push({ id: 'goals', label: 'Goals', tier: 'leaf' })

  const count = satellites.length
  const placed: PreviewNode[] = satellites.map((n, i) => {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2
    const radius = RADIUS[n.tier as Exclude<Tier, 'root'>]
    return {
      ...n,
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
      r: NODE_RADIUS[n.tier],
    }
  })

  return [
    { id: 'me', label: data.name.trim() || 'You', tier: 'root', x: CENTER.x, y: CENTER.y, r: NODE_RADIUS.root },
    ...placed,
  ]
}

export default function GraphPreview({ data }: Props) {
  const nodes = useMemo(() => buildNodes(data), [data])
  const hasSatellites = nodes.length > 1

  useGSAP(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const last = nodes[nodes.length - 1]
    if (!last) return
    gsap.fromTo(
      `.pg-node-${last.id}`,
      { opacity: 0, scale: 0.3, transformOrigin: `${last.x}px ${last.y}px` },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)' },
    )
  }, [nodes.length])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, padding: '32px 24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasSatellites ? 'var(--accent)' : 'var(--text-muted)', display: 'inline-block', transition: 'background-color 500ms ease' }} />
        <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-geist-sans), sans-serif', margin: 0 }}>
          {hasSatellites ? `Graph preview — ${nodes.length} node${nodes.length !== 1 ? 's' : ''}` : 'Graph preview'}
        </p>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg viewBox="0 0 400 340" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }} aria-label="Context graph preview" role="img">
          <defs>
            <radialGradient id="pg-node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <filter id="pg-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {!hasSatellites && (
            <g opacity="0.4">
              <circle cx={CENTER.x} cy={CENTER.y} r="60" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 6" />
              <circle cx={CENTER.x} cy={CENTER.y} r="100" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 8" />
            </g>
          )}

          {nodes.slice(1).map(n => (
            <line key={`edge-${n.id}`} x1={CENTER.x} y1={CENTER.y} x2={n.x} y2={n.y} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 5" opacity="0.7" />
          ))}

          <circle cx={CENTER.x} cy={CENTER.y} r="60" fill="url(#pg-node-glow)" />

          {nodes.map(node => {
            const colors = NODE_COLORS[node.tier]
            const caption = node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label
            return (
              <g key={node.id} className={`pg-node-${node.id}`}>
                <circle cx={node.x} cy={node.y + 1.5} r={node.r} fill="rgba(0,0,0,0.35)" opacity="0.6" />
                <circle
                  cx={node.x} cy={node.y} r={node.r}
                  fill={colors.fill}
                  stroke={node.tier === 'root' ? 'rgba(179,236,19,0.3)' : 'var(--border-strong)'}
                  strokeWidth={node.tier === 'root' ? 2 : 1}
                  filter={node.tier === 'root' ? 'url(#pg-glow)' : undefined}
                />
                {/* Initial inside the node — always fits regardless of label length */}
                <text
                  x={node.x} y={node.y + (node.tier === 'root' ? 6 : 5)}
                  textAnchor="middle"
                  fontSize={node.tier === 'root' ? 20 : node.tier === 'branch' ? 14 : 12}
                  fontWeight={700}
                  fill={colors.text}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {(node.label.trim()[0] ?? '?').toUpperCase()}
                </text>
                {/* Full label as a caption below the node */}
                <text
                  x={node.x} y={node.y + node.r + 14}
                  textAnchor="middle"
                  fontSize={node.tier === 'root' ? 11 : 9}
                  fontWeight={node.tier === 'root' ? 600 : 500}
                  fill={node.tier === 'root' ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {caption}
                </text>
              </g>
            )
          })}
        </svg>

        {!hasSatellites && (
          <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', fontFamily: 'var(--font-geist-sans), sans-serif' }}>
              Your graph builds here as you fill in each step
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

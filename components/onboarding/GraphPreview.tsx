'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'

interface Props {
  messageCount: number
  userText: string
}

const NODES = [
  { x: 200, y: 160, r: 34, tier: 'root',   defaultLabel: 'ME'        },
  { x:  88, y:  82, r: 21, tier: 'branch',  defaultLabel: 'Skills'    },
  { x: 312, y:  82, r: 21, tier: 'branch',  defaultLabel: 'Projects'  },
  { x:  72, y: 258, r: 16, tier: 'leaf',    defaultLabel: 'Goals'     },
  { x: 328, y: 258, r: 16, tier: 'leaf',    defaultLabel: 'Agency'    },
  { x: 200, y: 290, r: 14, tier: 'leaf',    defaultLabel: 'More'      },
]

const NODE_COLORS: Record<string, { fill: string; text: string }> = {
  root:   { fill: 'var(--accent)',      text: 'var(--on-accent)'      },
  branch: { fill: 'var(--card-raised)', text: 'var(--text-primary)'   },
  leaf:   { fill: 'var(--card)',        text: 'var(--text-secondary)'  },
}

function getLabels(text: string): string[] {
  const labels: string[] = []
  const nameMatch = text.match(/(?:I'm|I am|my name is|name's|call me)\s+([A-Z][a-z]+)/i)
  labels.push(nameMatch?.[1] ?? 'ME')

  const techWords = ['React', 'Next.js', 'TypeScript', 'Python', 'Node.js', 'Flutter', 'Vue', 'Angular', 'Swift', 'Kotlin', 'Go', 'Rust', 'Java', 'PHP', 'Django', 'Rails']
  const foundTech = techWords.find(t => new RegExp('\\b' + t + '\\b', 'i').test(text))
  labels.push(foundTech ?? 'Skills')

  const projMatch = text.match(/(?:working on|building|created|shipped)\s+(?:a\s+)?([A-Z][a-zA-Z0-9_-]+)/i)
  labels.push(projMatch?.[1] ?? 'Projects')

  labels.push('Goals')

  if (/agency|freelan|studio|client|business/i.test(text)) labels.push('Agency')
  else { const pm2 = text.match(/(?:also|another|second|other)\s+(?:called|named|is)\s+([A-Z][a-zA-Z0-9_-]+)/i); labels.push(pm2?.[1] ?? 'Work') }

  labels.push('More')

  return labels
}

export default function GraphPreview({ messageCount, userText }: Props) {
  const visibleCount = Math.min(messageCount, NODES.length)
  const labels = getLabels(userText)
  const nodesToShow = NODES.slice(0, visibleCount)
  const edges = nodesToShow.slice(1).map(n => ({ x1: 200, y1: 160, x2: n.x, y2: n.y }))

  useGSAP(() => {
    if (visibleCount === 0) return
    const idx = visibleCount - 1
    const node = NODES[idx]
    if (!node) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    gsap.fromTo(
      `.pg-node-${idx}`,
      { opacity: 0, scale: 0.3, transformOrigin: `${node.x}px ${node.y}px` },
      { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.8)' },
    )
  }, [visibleCount])

  const emptyState = visibleCount === 0

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, padding: '32px 24px 24px' }}>
      {/* Panel label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: emptyState ? 'var(--text-muted)' : 'var(--accent)', display: 'inline-block', transition: 'background-color 500ms ease' }} />
        <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-geist-sans), sans-serif', margin: 0 }}>
          {emptyState ? 'Graph preview' : `Graph preview — ${visibleCount} node${visibleCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* SVG */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg
          viewBox="0 0 400 340"
          width="100%"
          height="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-label="Context graph preview"
          role="img"
        >
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

          {/* Empty state ambient ring */}
          {emptyState && (
            <g opacity="0.4">
              <circle cx="200" cy="160" r="60" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 6" />
              <circle cx="200" cy="160" r="100" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 8" />
              <circle cx="200" cy="160" r="34" fill="var(--card)" stroke="var(--border-strong)" strokeWidth="1" />
              <text x="200" y="165" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)" fontFamily="var(--font-geist-sans), sans-serif">You</text>
            </g>
          )}

          {/* Edges */}
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeDasharray="4 5"
              className="cg-dash-flow"
              opacity="0.7"
            />
          ))}

          {/* Root node glow */}
          {visibleCount > 0 && (
            <circle cx="200" cy="160" r="60" fill="url(#pg-node-glow)" />
          )}

          {/* Nodes */}
          {nodesToShow.map((node, i) => {
            const colors = NODE_COLORS[node.tier]
            const label = labels[i] ?? node.defaultLabel
            return (
              <g key={i} className={`pg-node-${i}`} style={{ opacity: 1 }}>
                {/* Subtle node shadow */}
                <circle cx={node.x} cy={node.y + 1.5} r={node.r} fill="rgba(0,0,0,0.35)" opacity="0.6" />
                {/* Node fill */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={colors.fill}
                  stroke={node.tier === 'root' ? 'rgba(179,236,19,0.3)' : 'var(--border-strong)'}
                  strokeWidth={node.tier === 'root' ? 2 : 1}
                  filter={node.tier === 'root' ? 'url(#pg-glow)' : undefined}
                />
                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + (node.tier === 'root' ? 5 : 4)}
                  textAnchor="middle"
                  fontSize={node.tier === 'root' ? 13 : node.tier === 'branch' ? 10 : 9}
                  fontWeight={node.tier === 'root' ? 700 : 600}
                  fill={colors.text}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Empty state caption */}
        {emptyState && (
          <div style={{
            position: 'absolute', bottom: '20px', left: 0, right: 0,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', fontFamily: 'var(--font-geist-sans), sans-serif' }}>
              Your graph builds here as we talk
            </p>
          </div>
        )}
      </div>

      {/* Footer note when nodes exist */}
      {visibleCount > 0 && visibleCount < NODES.length && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontFamily: 'var(--font-geist-sans), sans-serif', lineHeight: '1.5' }}>
          {NODES.length - visibleCount} more node{NODES.length - visibleCount !== 1 ? 's' : ''} will appear as the conversation continues.
        </p>
      )}
    </div>
  )
}

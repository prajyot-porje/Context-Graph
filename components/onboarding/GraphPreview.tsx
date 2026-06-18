'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { Loader2 } from 'lucide-react'

interface Props {
  messageCount: number    // number of user messages sent so far
  userText: string        // all user messages joined — for keyword extraction
  isFinalizing: boolean
}

const PREVIEW_POSITIONS = [
  { x: 200, y: 140, r: 30, color: '#b3ec13', textColor: '#000', defaultLabel: 'ME' },
  { x:  95, y:  72, r: 19, color: '#EEEEEE', textColor: '#111', defaultLabel: 'Skills' },
  { x: 315, y:  75, r: 19, color: '#EEEEEE', textColor: '#111', defaultLabel: 'Project' },
  { x:  80, y: 240, r: 14, color: '#777',    textColor: '#fff', defaultLabel: 'Goals' },
  { x: 325, y: 238, r: 14, color: '#777',    textColor: '#fff', defaultLabel: 'Agency' },
  { x: 200, y: 268, r: 14, color: '#555',    textColor: '#fff', defaultLabel: 'More...' },
]

function getLabels(text: string): string[] {
  const labels: string[] = []
  
  // Label 0 — ME: try to extract name
  const nameMatch = text.match(/(?:I'm|I am|my name is|name's|call me)\s+([A-Z][a-z]+)/i)
  labels.push(nameMatch?.[1] ?? 'ME')
  
  // Label 1 — Skills: first recognized tech keyword
  const techWords = [
    'React', 'Next.js', 'TypeScript', 'Python', 'Node.js', 'Flutter',
    'Vue', 'Angular', 'Swift', 'Kotlin', 'Go', 'Rust', 'Java', 'PHP', 'Django', 'Rails'
  ]
  const foundTech = techWords.find(t => new RegExp('\\b' + t + '\\b', 'i').test(text))
  labels.push(foundTech ?? 'Skills')
  
  // Label 2 — Project: first capitalized word after "building" or "working on"
  const projMatch = text.match(/(?:working on|building|building a|created|shipped)\s+(?:a\s+)?([A-Z][a-zA-Z0-9_-]+)/i)
  labels.push(projMatch?.[1] ?? 'Project')
  
  // Label 3 — Goals
  labels.push('Goals')
  
  // Label 4 — Agency or second project
  if (/agency|freelan|studio|client|business/i.test(text)) {
    labels.push('Agency')
  } else {
    const projMatch2 = text.match(/(?:also|another project|second|other thing)\s+(?:called|named|is)\s+([A-Z][a-zA-Z0-9_-]+)/i)
    labels.push(projMatch2?.[1] ?? 'Project 2')
  }
  
  // Label 5
  labels.push('More...')
  
  return labels
}

export default function GraphPreview({ messageCount, userText, isFinalizing }: Props) {
  const visibleCount = Math.min(messageCount, PREVIEW_POSITIONS.length)
  const labels = getLabels(userText)
  const nodesToShow = PREVIEW_POSITIONS.slice(0, visibleCount)
  const edges = nodesToShow.slice(1).map(n => ({ x1: 200, y1: 140, x2: n.x, y2: n.y }))

  useGSAP(() => {
    if (visibleCount === 0) return
    const i = visibleCount - 1
    const pos = PREVIEW_POSITIONS[i]
    if (!pos) return
    gsap.fromTo(`.pg-node-${i}`,
      { opacity: 0, scale: 0.4, transformOrigin: `${pos.x}px ${pos.y}px` },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'cg-spring' }
    )
  }, [visibleCount])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <p style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--text-muted, #484848)',
        marginBottom: '12px',
        fontFamily: 'var(--font-geist, sans-serif)',
        fontWeight: 600,
      }}>
        GRAPH PREVIEW
      </p>
      
      {visibleCount === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted, #484848)',
          fontSize: '13px',
          textAlign: 'center',
          padding: '0 20px',
          fontFamily: 'var(--font-geist, sans-serif)',
          lineHeight: '1.6',
        }}>
          Your graph will build here as we chat...
        </div>
      ) : (
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <svg
            viewBox="0 0 400 300"
            width="100%"
            height="100%"
            style={{ display: 'block', maxHeight: '280px', flex: 1 }}
          >
            <defs>
              <pattern id="pg-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#pg-dots)" rx="8" />
            
            {edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke="rgba(179,236,19,0.2)"
                strokeWidth="1.5"
              />
            ))}
            
            {nodesToShow.map((pos, i) => (
              <g key={i} className={`pg-node-${i}`} style={{ opacity: 1 }}>
                <circle cx={pos.x} cy={pos.y} r={pos.r} fill={pos.color} />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize={i === 0 ? '12' : '9'}
                  fontWeight="700"
                  fill={pos.textColor}
                  fontFamily="var(--font-geist, sans-serif)"
                >
                  {labels[i] ?? pos.defaultLabel}
                </text>
              </g>
            ))}
          </svg>
          
          {isFinalizing && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: 'rgba(8,8,8,0.75)',
              borderRadius: '12px',
            }}>
              <Loader2 size={24} className="cg-spin text-[var(--accent)]" />
              <p style={{
                fontSize: '13px',
                color: 'var(--accent, #b3ec13)',
                fontFamily: 'var(--font-geist, sans-serif)',
                fontWeight: 600,
              }}>
                Building your graph...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

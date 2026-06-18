'use client'

interface Props {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, className, style }: Props) {
  const h = typeof height === 'number' ? `${height}px` : height
  const br = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
  return (
    <div
      className={className}
      style={{
        width,
        height: h,
        borderRadius: br,
        background: 'linear-gradient(90deg, var(--card) 25%, var(--card-raised) 50%, var(--card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'cg-shimmer 1.6s infinite linear',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

import React from 'react'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  style?: React.CSSProperties
}

const sizes = {
  xs: { wh: '20px', font: '9px' },
  sm: { wh: '28px', font: '11px' },
  md: { wh: '34px', font: '13px' },
  lg: { wh: '42px', font: '16px' },
  xl: { wh: '56px', font: '20px' },
}

const palettes = [
  ['#4f46e5','#6366f1'], ['#0891b2','#06b6d4'], ['#059669','#10b981'],
  ['#d97706','#f59e0b'], ['#dc2626','#ef4444'], ['#7c3aed','#8b5cf6'],
  ['#db2777','#ec4899'], ['#0284c7','#0ea5e9'],
]

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getPalette(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palettes[Math.abs(hash) % palettes.length]
}

export default function Avatar({ name, src, size = 'md', style }: AvatarProps) {
  const { wh, font } = sizes[size]
  const [from, to] = getPalette(name)

  if (src) {
    return (
      <img src={src} alt={name} title={name} style={{
        width: wh, height: wh, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0, display: 'block', ...style,
      }} />
    )
  }

  return (
    <div title={name} style={{
      width: wh, height: wh, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: font, fontWeight: 700, color: 'white',
      letterSpacing: '0.02em', ...style,
    }}>
      {getInitials(name)}
    </div>
  )
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: {
  users: { name: string; avatarUrl?: string }[]
  max?: number
  size?: AvatarProps['size']
}) {
  const { wh, font } = sizes[size]
  const visible = users.slice(0, max)
  const extra = users.length - max

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((u, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? '-6px' : 0, borderRadius: '50%', border: '2px solid #0a1628', flexShrink: 0 }}>
          <Avatar name={u.name} src={u.avatarUrl} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: '-6px', width: wh, height: wh, borderRadius: '50%',
          background: '#162236', border: '2px solid #0a1628',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: font, fontWeight: 600, color: '#64748b', flexShrink: 0,
        }}>+{extra}</div>
      )}
    </div>
  )
}
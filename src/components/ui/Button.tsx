import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"/>
    <path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const base: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 500, border: 'none', cursor: 'pointer',
  transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
  outline: 'none', position: 'relative', whiteSpace: 'nowrap',
  letterSpacing: '-0.01em',
}

const variants: Record<Variant, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' },
  secondary: { background: '#0f1f35', color: '#94a3b8', border: '1px solid #1e3054' },
  ghost: { background: 'transparent', color: '#64748b', border: '1px solid transparent' },
  danger: { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  outline: { background: 'transparent', color: '#94a3b8', border: '1px solid #1e3054' },
}

const sizes: Record<Size, React.CSSProperties> = {
  xs: { padding: '5px 10px', fontSize: '11px', borderRadius: '7px', gap: '5px', height: '26px' },
  sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '8px', gap: '6px', height: '30px' },
  md: { padding: '8px 16px', fontSize: '13px', borderRadius: '10px', gap: '7px', height: '36px' },
  lg: { padding: '11px 20px', fontSize: '14px', borderRadius: '12px', gap: '8px', height: '44px' },
}

export default function Button({
  variant = 'primary', size = 'md', loading = false,
  icon, iconRight, fullWidth, children, style, disabled, ...props
}: Props) {
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)

  const hoverStyles: Partial<Record<Variant, React.CSSProperties>> = {
    primary: { filter: 'brightness(1.1)', transform: pressed ? 'scale(0.98)' : 'translateY(-1px)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' },
    secondary: { background: '#162236', borderColor: '#2a3f63', color: '#cbd5e1' },
    ghost: { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderColor: '#1e3054' },
    danger: { filter: 'brightness(1.1)', transform: pressed ? 'scale(0.98)' : 'translateY(-1px)' },
    outline: { background: 'rgba(255,255,255,0.04)', borderColor: '#2a3f63', color: '#cbd5e1' },
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        ...base,
        ...variants[variant],
        ...sizes[size],
        ...(fullWidth && { width: '100%' }),
        ...(hovered && !disabled && !loading ? hoverStyles[variant] : {}),
        ...(pressed && !disabled && !loading ? { transform: 'scale(0.97)' } : {}),
        ...(disabled || loading ? { opacity: 0.5, cursor: 'not-allowed', transform: 'none' } : {}),
        ...style,
      }}
    >
      {loading
        ? <Spinner />
        : icon ? <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
        : null
      }
      {children && <span>{children}</span>}
      {iconRight && !loading && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>
      )}
    </button>
  )
}
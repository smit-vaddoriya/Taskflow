import React from 'react'
import type { Role } from '../../types'

const CONFIG: Record<Role, { label: string; color: string; bg: string; border: string }> = {
  OWNER:   { label: 'Owner',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  ADMIN:   { label: 'Admin',   color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)'  },
  MANAGER: { label: 'Manager', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  MEMBER:  { label: 'Member',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
  VIEWER:  { label: 'Viewer',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
}

export default function RoleBadge({ role, size = 'sm' }: { role: Role; size?: 'xs' | 'sm' }) {
  const c = CONFIG[role]
  return (
    <span style={{
      fontSize: size === 'xs' ? '9px' : '10px',
      fontWeight: 700,
      padding: size === 'xs' ? '1px 5px' : '2px 7px',
      borderRadius: '99px',
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.border}`,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}
import React from 'react'
import type { Priority, TaskStatus } from '../../types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'
  size?: 'sm' | 'md'
  dot?: boolean
  style?: React.CSSProperties
}

const config = {
  default: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', dot: '#64748b' },
  success: { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', dot: '#22c55e' },
  warning: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', dot: '#f59e0b' },
  danger:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', dot: '#ef4444' },
  info:    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', dot: '#3b82f6' },
  purple:  { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', dot: '#a855f7' },
  orange:  { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', dot: '#f97316' },
}

export default function Badge({ children, variant = 'default', size = 'sm', dot = false, style }: BadgeProps) {
  const c = config[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: size === 'sm' ? '3px 8px' : '4px 10px',
      fontSize: size === 'sm' ? '11px' : '12px',
      fontWeight: 500, borderRadius: '99px',
      background: c.bg, color: c.color,
      letterSpacing: '0.01em',
      ...style,
    }}>
      {dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
      {children}
    </span>
  )
}

const priorityMap: Record<Priority, { label: string; variant: BadgeProps['variant'] }> = {
  NONE:   { label: 'No priority', variant: 'default' },
  LOW:    { label: 'Low',         variant: 'info'    },
  MEDIUM: { label: 'Medium',      variant: 'warning' },
  HIGH:   { label: 'High',        variant: 'orange'  },
  URGENT: { label: 'Urgent',      variant: 'danger'  },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, variant } = priorityMap[priority]
  return <Badge variant={variant} dot>{label}</Badge>
}

const statusMap: Record<TaskStatus, { label: string; variant: BadgeProps['variant'] }> = {
  BACKLOG:     { label: 'Backlog',     variant: 'default' },
  TODO:        { label: 'To Do',       variant: 'default' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info'    },
  IN_REVIEW:   { label: 'In Review',   variant: 'purple'  },
  DONE:        { label: 'Done',        variant: 'success' },
  CANCELLED:   { label: 'Cancelled',   variant: 'danger'  },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, variant } = statusMap[status]
  return <Badge variant={variant} dot>{label}</Badge>
}
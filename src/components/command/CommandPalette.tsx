import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, FolderKanban, BarChart3,
  Settings, Plus, Zap, ArrowRight, Hash, Users,
  Command, ChevronRight,
} from 'lucide-react'
import { C, R } from '../../design/tokens'
import { useProjects } from '../../hooks/useOrg'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

interface Item {
  id: string
  label: string
  sublabel?: string
  icon: React.ReactNode
  action: () => void
  category: string
  shortcut?: string
}

interface Props {
  open: boolean
  onClose: () => void
}

const iconStyle: React.CSSProperties = { flexShrink: 0, color: C.t3 }

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { data: projects = [] } = useProjects()
  const { currentOrg } = useAuthStore()
  const { openModal } = useUIStore()

  const go = useCallback((path: string) => { navigate(path); onClose() }, [navigate, onClose])

  const baseItems: Item[] = [
    { id: 'dashboard',  label: 'Go to Dashboard',  icon: <LayoutDashboard size={15} style={iconStyle} />, action: () => go('/dashboard'),  category: 'Navigate', shortcut: 'G D' },
    { id: 'projects',   label: 'Go to Projects',   icon: <FolderKanban size={15} style={iconStyle} />,    action: () => go('/projects'),   category: 'Navigate', shortcut: 'G P' },
    { id: 'analytics',  label: 'Go to Analytics',  icon: <BarChart3 size={15} style={iconStyle} />,       action: () => go('/analytics'),  category: 'Navigate', shortcut: 'G A' },
    { id: 'members',    label: 'Go to Members',     icon: <Users size={15} style={iconStyle} />,           action: () => go('/settings/members'), category: 'Navigate' },
    { id: 'settings',   label: 'Go to Settings',    icon: <Settings size={15} style={iconStyle} />,       action: () => go('/settings'),   category: 'Navigate', shortcut: 'G S' },
    { id: 'new-task',   label: 'Create new task',   icon: <Plus size={15} style={{ ...iconStyle, color: C.a2 }} />, action: () => { openModal('createTask'); onClose() }, category: 'Actions', shortcut: 'C' },
    { id: 'new-proj',   label: 'Create new project',icon: <FolderKanban size={15} style={{ ...iconStyle, color: C.a2 }} />, action: () => { go('/projects') }, category: 'Actions' },
    { id: 'ask-ai',     label: 'Ask AI assistant',  icon: <Zap size={15} style={{ ...iconStyle, color: '#a78bfa' }} />, action: () => { openModal('askAI'); onClose() }, category: 'Actions', shortcut: '⌘/' },
    ...projects.map(p => ({
      id: `project-${p.id}`,
      label: p.name,
      sublabel: 'Project',
      icon: <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />,
      action: () => go(`/projects/${p.id}`),
      category: 'Projects',
    })),
  ]

  const filtered = query.trim()
    ? baseItems.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.sublabel?.toLowerCase().includes(query.toLowerCase()) ||
        i.category.toLowerCase().includes(query.toLowerCase())
      )
    : baseItems

  const grouped = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const flatItems = Object.values(grouped).flat()

  useEffect(() => { setSelected(0) }, [query])
  useEffect(() => { if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50) } }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatItems.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter')     { e.preventDefault(); flatItems[selected]?.action() }
      if (e.key === 'Escape')    { onClose() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, flatItems, selected, onClose])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!open) return null

  let globalIdx = 0

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div
        className="a-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '560px',
          background: C.bg2,
          border: `1px solid ${C.b2}`,
          borderRadius: R['2xl'],
          boxShadow: C.shadowModal,
          overflow: 'hidden',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', borderBottom: `1px solid ${C.b1}` }}>
          <Search size={16} color={C.t3} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands, navigate, create..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              fontSize: '15px', color: C.t1, outline: 'none',
              fontWeight: 400,
            }}
          />
          <kbd style={{ fontSize: '11px', color: C.t4, background: C.bg1, padding: '3px 7px', borderRadius: R.sm, border: `1px solid ${C.b2}`, flexShrink: 0, fontFamily: 'inherit' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '380px', overflowY: 'auto', padding: '6px' }}>
          {flatItems.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: C.t3, fontSize: '13px' }}>
              No results for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '4px' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 10px 4px' }}>
                  {category}
                </p>
                {items.map(item => {
                  const idx = globalIdx++
                  const isSelected = idx === selected
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', borderRadius: R.md,
                        background: isSelected ? C.bg3 : 'transparent',
                        border: `1px solid ${isSelected ? C.b2 : 'transparent'}`,
                        cursor: 'pointer', textAlign: 'left', transition: 'none',
                      }}
                    >
                      <span style={{ width: '26px', height: '26px', borderRadius: R.sm, background: isSelected ? C.bg4 : C.bg1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${C.b1}` }}>
                        {item.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: isSelected ? C.t1 : C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p style={{ fontSize: '11px', color: C.t4 }}>{item.sublabel}</p>
                        )}
                      </div>
                      {item.shortcut && (
                        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                          {item.shortcut.split(' ').map((k, i) => (
                            <kbd key={i} style={{ fontSize: '10px', color: isSelected ? C.t2 : C.t4, background: C.bg1, padding: '2px 5px', borderRadius: '4px', border: `1px solid ${C.b1}`, fontFamily: 'inherit' }}>
                              {k}
                            </kbd>
                          ))}
                        </div>
                      )}
                      {isSelected && <ChevronRight size={13} color={C.t3} style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: `1px solid ${C.b1}` }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C.t4 }}>
                <kbd style={{ fontSize: '10px', background: C.bg1, padding: '2px 5px', borderRadius: '4px', border: `1px solid ${C.b1}`, fontFamily: 'inherit', color: C.t3 }}>{k}</kbd>
                {v}
              </span>
            ))}
          </div>
          <span style={{ fontSize: '11px', color: C.t4, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={10} color={C.a2} /> TaskFlow AI
          </span>
        </div>
      </div>
    </div>
  )
}
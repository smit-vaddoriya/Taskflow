import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, BarChart3, Users,
  Settings, LogOut, ChevronDown, Plus,
  PanelLeftClose, PanelLeftOpen, Building2, Zap, Search,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import RoleBadge from '../ui/RoleBadge'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useProjects } from '../../hooks/useOrg'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'

interface Props { onOpenCmd: () => void }

export default function Sidebar({ onOpenCmd }: Props) {
  const { user, currentOrg, organizations, setCurrentOrg } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { logout }          = useAuth()
  const { data: projects = [] } = useProjects()
  const { can, role }       = usePermissions()
  const [orgOpen, setOrgOpen] = useState(false)
  const navigate = useNavigate()
  const W = sidebarCollapsed ? '52px' : '220px'

  const navItemBase = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center',
    gap: sidebarCollapsed ? 0 : '9px',
    padding: sidebarCollapsed ? '8px' : '6px 10px',
    borderRadius: R.lg, fontSize: '13px', fontWeight: 500,
    textDecoration: 'none', cursor: 'pointer',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    transition: 'background 0.12s, color 0.12s',
    width: '100%', border: 'none',
    color: isActive ? '#a78bfa' : C.t3,
    background: isActive ? C.am : 'transparent',
    outline: `1px solid ${isActive ? C.ab : 'transparent'}`,
  })

  const NAV = [
    { to: '/dashboard',        Icon: LayoutDashboard, label: 'Dashboard',  show: true               },
    { to: '/projects',         Icon: FolderKanban,    label: 'Projects',   show: true               },
    { to: '/analytics',        Icon: BarChart3,        label: 'Analytics',  show: can.viewAnalytics  },
    { to: '/settings/members', Icon: Users,            label: 'Members',    show: true               },
  ]

  const hoverOn = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement
    if (!el.style.background.includes('rgba(124')) { el.style.background = C.bg2; el.style.color = C.t1 }
  }
  const hoverOff = (e: React.MouseEvent, isActive: boolean) => {
    const el = e.currentTarget as HTMLElement
    if (!el.style.background.includes('rgba(124')) {
      el.style.background = isActive ? C.am : 'transparent'
      el.style.color = isActive ? '#a78bfa' : C.t3
    }
  }

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column',
      width: W, minWidth: W, height: '100%', flexShrink: 0,
      background: C.bg1, borderRight: `1px solid ${C.b1}`,
      transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1), min-width 0.2s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden', position: 'relative',
    }}>

      {/* Brand + Workspace */}
      <div style={{ padding: sidebarCollapsed ? '12px 6px' : '12px 10px', borderBottom: `1px solid ${C.b1}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '4px 2px 10px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: R.md, flexShrink: 0, background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${C.am}` }}>
            <Zap size={12} color="white" fill="white" strokeWidth={0} />
          </div>
          {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: 700, color: C.t1, letterSpacing: '-0.04em' }}>TaskFlow</span>}
        </div>

        {/* Workspace switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            style={{ ...navItemBase(false), background: orgOpen ? C.bg2 : 'transparent', outline: `1px solid ${orgOpen ? C.b2 : 'transparent'}` }}
            onMouseEnter={hoverOn}
            onMouseLeave={e => hoverOff(e, false)}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: R.sm, flexShrink: 0, background: `${C.a1}20`, border: `1px solid ${C.ab}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900, color: C.a2 }}>
              {currentOrg?.name?.[0]?.toUpperCase() ?? 'W'}
            </div>
            {!sidebarCollapsed && (
              <>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  {currentOrg?.name ?? 'Workspace'}
                </span>
                <ChevronDown size={12} color={C.t4} style={{ flexShrink: 0, transform: orgOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </>
            )}
          </button>

          {orgOpen && !sidebarCollapsed && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', zIndex: 50, background: C.bg2, border: `1px solid ${C.b2}`, borderRadius: R.xl, overflow: 'hidden', boxShadow: C.shadowElevated, animation: 'slideDown 0.15s ease-out' }}>
              {organizations.map(org => (
                <button key={org.id} onClick={() => { setCurrentOrg(org); setOrgOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', background: currentOrg?.id === org.id ? C.am : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (currentOrg?.id !== org.id) e.currentTarget.style.background = C.bg3 }}
                  onMouseLeave={e => { if (currentOrg?.id !== org.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: R.sm, background: `${C.a1}20`, border: `1px solid ${C.ab}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: C.a2, flexShrink: 0 }}>
                    {org.name[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</p>
                    <p style={{ fontSize: '10px', color: C.t4, textTransform: 'capitalize' }}>{org.role?.toLowerCase()}</p>
                  </div>
                  {currentOrg?.id === org.id && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.a2, flexShrink: 0 }} />}
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${C.b1}`, padding: '4px' }}>
                <button onClick={() => { navigate('/setup'); setOrgOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.t3, borderRadius: R.md, transition: 'all 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.t2 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3 }}
                >
                  <Plus size={12} /> New workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search / cmd */}
        {!sidebarCollapsed ? (
          <button onClick={onOpenCmd} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px',
            padding: '7px 10px', background: C.bg0, border: `1px solid ${C.b1}`, borderRadius: R.lg,
            cursor: 'pointer', color: C.t4, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.b2; e.currentTarget.style.color = C.t3 }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.b1; e.currentTarget.style.color = C.t4 }}
          >
            <Search size={12} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '12px', textAlign: 'left' }}>Search...</span>
            <kbd style={{ fontSize: '10px', background: C.bg2, color: C.t4, padding: '2px 5px', borderRadius: '5px', border: `1px solid ${C.b2}`, fontFamily: 'inherit' }}>⌘K</kbd>
          </button>
        ) : (
          <button onClick={onOpenCmd} title="Search (⌘K)" style={{ ...navItemBase(false), marginTop: '6px', background: 'transparent', outline: '1px solid transparent' }}
            onMouseEnter={hoverOn} onMouseLeave={e => hoverOff(e, false)}>
            <Search size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: sidebarCollapsed ? '8px 6px' : '8px 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {NAV.filter(n => n.show).map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} title={sidebarCollapsed ? label : undefined}
            style={({ isActive }) => navItemBase(isActive)}
            onMouseEnter={hoverOn}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              const isActive = el.style.background.includes('rgba(124')
              if (!isActive) { el.style.background = 'transparent'; el.style.color = C.t3 }
            }}
          >
            <Icon size={14} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && label}
          </NavLink>
        ))}

        {/* Projects list */}
        {!sidebarCollapsed && projects.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 10px 6px' }}>
              Projects
            </p>
            {projects.map(p => (
              <NavLink key={p.id} to={`/projects/${p.id}`}
                style={({ isActive }) => ({ ...navItemBase(isActive), fontSize: '12px', padding: '5px 10px' })}
                onMouseEnter={hoverOn}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  if (!el.style.background.includes('rgba(124')) { el.style.background = 'transparent'; el.style.color = C.t3 }
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 5px ${p.color}` }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: sidebarCollapsed ? '8px 6px' : '8px 10px', borderTop: `1px solid ${C.b1}`, display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <NavLink to="/settings" title={sidebarCollapsed ? 'Settings' : undefined}
          style={({ isActive }) => navItemBase(isActive)}
          onMouseEnter={hoverOn}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            if (!el.style.background.includes('rgba(124')) { el.style.background = 'transparent'; el.style.color = C.t3 }
          }}
        >
          <Settings size={14} style={{ flexShrink: 0 }} />
          {!sidebarCollapsed && 'Settings'}
        </NavLink>

        <button onClick={logout} title={sidebarCollapsed ? 'Sign out' : undefined}
          style={{ ...navItemBase(false), color: C.t4, background: 'transparent', outline: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${C.red}10`; e.currentTarget.style.color = C.red }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          {!sidebarCollapsed && 'Sign out'}
        </button>

        {/* User row with role badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: sidebarCollapsed ? '8px 6px' : '10px 8px 6px',
          marginTop: '4px', borderTop: `1px solid ${C.b1}`,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}>
          <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size="sm" />
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <div style={{ marginTop: '3px' }}>
                <RoleBadge role={role} size="xs" />
              </div>
            </div>
          )}
        </div>

        <button onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          style={{ ...navItemBase(false), justifyContent: 'center', background: 'transparent', outline: '1px solid transparent', color: C.t4 }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t3 }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>
      </div>
    </aside>
  )
}
import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, FolderKanban, ArrowUpRight, Zap, Activity } from 'lucide-react'
import { format } from 'date-fns'
import apiClient from '../../services/apiClient'
import VelocityChart from '../../components/analytics/VelocityChart'
import InsightCard from '../../components/ai/InsightCard'
import Avatar from '../../components/ui/Avatar'
import { useAuthStore } from '../../store/authStore'
import { useProjects } from '../../hooks/useOrg'
import { C, R } from '../../design/tokens'
import type { AnalyticsOverview, Task } from '../../types'

const MOCK_V = [
  { date: 'Mon', completed: 4, created: 6 }, { date: 'Tue', completed: 7, created: 5 },
  { date: 'Wed', completed: 5, created: 8 }, { date: 'Thu', completed: 9, created: 4 },
  { date: 'Fri', completed: 6, created: 7 }, { date: 'Sat', completed: 3, created: 2 },
  { date: 'Sun', completed: 2, created: 3 },
]

interface StatProps {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; color: string; muted: string
}

function Stat({ label, value, sub, icon, color, muted }: StatProps) {
  const [hov, setHov] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.bg2 : C.bg1,
        border: `1px solid ${hov ? C.b2 : C.b1}`,
        borderRadius: R.xl, padding: '18px',
        transition: 'all 0.15s', cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: R.md, background: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '5px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: C.t4 }}>{sub}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, currentOrg } = useAuthStore()
  const { data: projects = [] } = useProjects()

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'overview', currentOrg?.id],
    queryFn: async () => { const { data } = await apiClient.get('/analytics/overview'); return data.data as AnalyticsOverview },
    enabled: !!currentOrg,
    placeholderData: { totalTasks: 48, completedTasks: 31, inProgressTasks: 12, overdueTasks: 5, completionRate: 64, velocityChange: 12, avgBlockedDays: 1.4 },
  })

  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks', currentOrg?.id],
    queryFn: async () => { const { data } = await apiClient.get(`/tasks?assigneeId=${user?.id}`); return data.data as Task[] },
    enabled: !!currentOrg && !!user, placeholderData: [],
  })

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const inProg    = myTasks.filter(t => t.status === 'IN_PROGRESS').slice(0, 5)
  const overdueTasks = myTasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).slice(0, 3)

  const card: React.CSSProperties = { background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header — tight, intentional */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {greeting}, {user?.name?.split(' ')[0]}.
            </h1>
          </div>

          {/* Completion arc */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <p style={{ fontSize: '10px', color: C.t4, fontWeight: 500 }}>Completion rate</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: C.a2, letterSpacing: '-0.05em' }}>{analytics?.completionRate ?? 0}</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: C.t3 }}>%</span>
            </div>
            <div style={{ height: '3px', width: '80px', background: C.bg4, borderRadius: R.full, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${analytics?.completionRate ?? 0}%`, background: C.a1, borderRadius: R.full, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        <Stat label="Completed"   value={analytics?.completedTasks ?? 0}  sub={`${analytics?.completionRate ?? 0}% completion`}  icon={<CheckCircle2 size={14} color={C.green} />}  color={C.green}  muted={C.greenM} />
        <Stat label="In Progress" value={analytics?.inProgressTasks ?? 0} sub="Active tasks"        icon={<Clock size={14} color={C.blue} />}         color={C.blue}   muted={C.blueM} />
        <Stat label="Overdue"     value={analytics?.overdueTasks ?? 0}    sub="Need attention"     icon={<AlertTriangle size={14} color={C.red} />}   color={C.red}    muted={C.redM} />
        <Stat label="Velocity"    value={`${(analytics?.velocityChange ?? 0) > 0 ? '+' : ''}${analytics?.velocityChange ?? 0}%`} sub="vs last week" icon={<TrendingUp size={14} color={C.purple} />} color={C.purple} muted={C.purpleM} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', marginBottom: '20px' }}>

        {/* Velocity chart */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: C.t2, letterSpacing: '-0.01em' }}>Team Velocity</h2>
              <p style={{ fontSize: '11px', color: C.t4, marginTop: '2px' }}>Tasks created vs completed this week</p>
            </div>
            <Link to="/analytics" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.t4, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.a2}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.t4}
            >
              Full analytics <ArrowUpRight size={11} />
            </Link>
          </div>
          <VelocityChart data={MOCK_V} />
        </div>

        {/* My work */}
        <div style={{ ...card, padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: C.t2, marginBottom: '2px' }}>My Work</h2>
            <p style={{ fontSize: '11px', color: C.t4 }}>
              {inProg.length} in progress · {overdueTasks.length} overdue
            </p>
          </div>

          {inProg.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: '8px' }}>
              <CheckCircle2 size={24} color={`${C.green}60`} />
              <p style={{ fontSize: '12px', color: C.t4, textAlign: 'center' }}>All caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {inProg.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 8px', borderRadius: R.md, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg2}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: task.priority === 'URGENT' ? C.red : task.priority === 'HIGH' ? C.orange : task.priority === 'MEDIUM' ? C.yellow : C.t4, flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: '12px', color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                  {task.assignee && <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="xs" />}
                </div>
              ))}
            </div>
          )}

          {overdueTasks.length > 0 && (
            <>
              <div style={{ height: '1px', background: C.b1 }} />
              <div>
                <p style={{ fontSize: '10px', fontWeight: 600, color: C.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={9} /> Overdue
                </p>
                {overdueTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 8px', borderRadius: R.md, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg2}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <p style={{ flex: 1, fontSize: '12px', color: C.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>{task.title}</p>
                    {task.dueDate && <span style={{ fontSize: '10px', color: C.red }}>{format(new Date(task.dueDate), 'MMM d')}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {analytics && (
        <div style={{ marginBottom: '20px' }}>
          <InsightCard metrics={{ completionRate: analytics.completionRate, velocityChange: analytics.velocityChange, overdueCount: analytics.overdueTasks, avgBlockedDays: analytics.avgBlockedDays, topContributors: [] }} />
        </div>
      )}

      {/* Projects — dense grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Projects</h2>
          <Link to="/projects" style={{ fontSize: '11px', color: C.t4, display: 'flex', alignItems: 'center', gap: '3px', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.a2}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.t4}
          >
            View all <ArrowUpRight size={10} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {projects.slice(0, 6).map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ ...card, padding: '14px', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${p.color}50`; el.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.b1; el.style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: R.md, background: `${p.color}18`, border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderKanban size={14} color={p.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{p.name}</p>
                    <p style={{ fontSize: '10px', color: C.t4 }}>{(p as any)._count?.boards ?? 0} boards</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.color, boxShadow: `0 0 5px ${p.color}` }} />
                  <span style={{ fontSize: '10px', color: C.t4 }}>{format(new Date(p.createdAt), 'MMM yyyy')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
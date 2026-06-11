import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Users,
} from 'lucide-react'
import apiClient from '../../services/apiClient'
import VelocityChart from '../../components/analytics/VelocityChart'
import BurndownChart from '../../components/analytics/BurndownChart'
import InsightCard from '../../components/ai/InsightCard'
import Avatar from '../../components/ui/Avatar'
import AccessDenied from '../../components/auth/AccessDenied'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'
import type { AnalyticsOverview, VelocityDataPoint } from '../../types'

const MOCK_BURNDOWN = [
  { day: '1',  ideal: 50, actual: 50 },
  { day: '2',  ideal: 45, actual: 47 },
  { day: '3',  ideal: 40, actual: 44 },
  { day: '4',  ideal: 35, actual: 38 },
  { day: '5',  ideal: 30, actual: 35 },
  { day: '6',  ideal: 25, actual: 30 },
  { day: '7',  ideal: 20, actual: 22 },
  { day: '8',  ideal: 15, actual: 18 },
  { day: '9',  ideal: 10, actual: 14 },
  { day: '10', ideal: 5,  actual: 8  },
]

const MOCK_VELOCITY = [
  { date: 'Mon', completed: 4, created: 6 },
  { date: 'Tue', completed: 7, created: 5 },
  { date: 'Wed', completed: 5, created: 8 },
  { date: 'Thu', completed: 9, created: 4 },
  { date: 'Fri', completed: 6, created: 7 },
  { date: 'Sat', completed: 3, created: 2 },
  { date: 'Sun', completed: 2, created: 3 },
]

// ─── Stat card ────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
  muted: string
}

function StatCard({ icon, label, value, sub, color, muted }: StatCardProps) {
  const [hov, setHov] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.bg2 : C.bg1,
        border: `1px solid ${hov ? C.b2 : C.b1}`,
        borderRadius: R.xl, padding: '20px',
        transition: 'all 0.15s', cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <div style={{ width: '30px', height: '30px', borderRadius: R.md, background: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '30px', fontWeight: 900, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '5px' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '11px', color: C.t4, fontWeight: 500 }}>{sub}</p>}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        {icon && (
          <div style={{ width: '26px', height: '26px', borderRadius: R.md, background: C.am, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
        )}
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: C.t2, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { currentOrg }    = useAuthStore()
  const { can, role }     = usePermissions()

  // ── Access guard — MANAGER+ only ──
  if (!can.viewAnalytics) {
    return (
      <AccessDenied
        message="Analytics is available to Managers, Admins, and Owners. Contact your workspace admin to request access."
        requiredRole="MANAGER"
      />
    )
  }

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview', currentOrg?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/overview')
      return data.data as AnalyticsOverview
    },
    enabled: !!currentOrg,
    placeholderData: {
      totalTasks: 48, completedTasks: 31, inProgressTasks: 12,
      overdueTasks: 5, completionRate: 64, velocityChange: 12, avgBlockedDays: 1.4,
    },
  })

  const { data: velocity = [] } = useQuery({
    queryKey: ['analytics', 'velocity', currentOrg?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/velocity')
      return data.data as VelocityDataPoint[]
    },
    enabled: !!currentOrg,
  })

  const { data: memberStats = [] } = useQuery({
    queryKey: ['analytics', 'members', currentOrg?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/members')
      return data.data as {
        userId: string; name: string; avatarUrl?: string
        assigned: number; completed: number
      }[]
    },
    enabled: !!currentOrg,
  })

  const velocityData = velocity.length > 0 ? velocity : MOCK_VELOCITY

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: R.xl, background: C.am, border: `1px solid ${C.ab}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={18} color={C.a2} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', marginBottom: '2px' }}>Analytics</h1>
          <p style={{ fontSize: '12px', color: C.t4 }}>Track your team's performance and velocity</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard
          icon={<CheckCircle2 size={14} color={C.green} />}
          label="Completed"
          value={overview?.completedTasks ?? 0}
          sub={`${overview?.completionRate ?? 0}% completion rate`}
          color={C.green}
          muted={C.greenM}
        />
        <StatCard
          icon={<Clock size={14} color={C.blue} />}
          label="In Progress"
          value={overview?.inProgressTasks ?? 0}
          sub="Active right now"
          color={C.blue}
          muted={C.blueM}
        />
        <StatCard
          icon={<AlertTriangle size={14} color={C.red} />}
          label="Overdue"
          value={overview?.overdueTasks ?? 0}
          sub="Need attention"
          color={C.red}
          muted={C.redM}
        />
        <StatCard
          icon={<TrendingUp size={14} color={C.purple} />}
          label="Velocity"
          value={`${(overview?.velocityChange ?? 0) > 0 ? '+' : ''}${overview?.velocityChange ?? 0}%`}
          sub="vs last week"
          color={C.purple}
          muted={C.purpleM}
        />
      </div>

      {/* Completion rate bar */}
      <div style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl, padding: '18px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: C.t3 }}>Overall completion</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: C.a2, letterSpacing: '-0.04em' }}>
            {overview?.completionRate ?? 0}%
          </p>
        </div>
        <div style={{ height: '6px', background: C.bg0, borderRadius: R.full, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: R.full,
            width: `${overview?.completionRate ?? 0}%`,
            background: `linear-gradient(90deg, ${C.a1}, ${C.a2})`,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 12px ${C.a1}60`,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '10px', color: C.t4 }}>0%</span>
          <span style={{ fontSize: '10px', color: C.t4 }}>100%</span>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <Card title="Weekly Velocity">
          <VelocityChart data={velocityData} />
        </Card>
        <Card title="Sprint Burndown">
          <BurndownChart data={MOCK_BURNDOWN} totalPoints={50} />
        </Card>
      </div>

      {/* AI Insight */}
      {overview && (
        <div style={{ marginBottom: '20px' }}>
          <InsightCard
            metrics={{
              completionRate: overview.completionRate,
              velocityChange: overview.velocityChange,
              overdueCount:   overview.overdueTasks,
              avgBlockedDays: overview.avgBlockedDays,
              topContributors: memberStats.slice(0, 3).map(m => m.name),
            }}
          />
        </div>
      )}

      {/* Team performance */}
      {memberStats.length > 0 && (
        <Card
          title="Team Performance"
          icon={<Users size={13} color={C.a2} />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {memberStats.map(member => {
              const rate = member.assigned > 0
                ? Math.round((member.completed / member.assigned) * 100)
                : 0

              const barColor = rate >= 80 ? C.green : rate >= 50 ? C.a1 : rate >= 30 ? C.yellow : C.red

              return (
                <div key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: C.t1 }}>{member.name}</p>
                      <span style={{ fontSize: '11px', color: C.t4 }}>
                        {member.completed}/{member.assigned} tasks
                      </span>
                    </div>
                    <div style={{ height: '4px', background: C.bg0, borderRadius: R.full, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: R.full,
                        width: `${rate}%`,
                        background: barColor,
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: `0 0 8px ${barColor}60`,
                      }} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: 700,
                    color: barColor, width: '36px',
                    textAlign: 'right', flexShrink: 0,
                  }}>
                    {rate}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.b1}` }}>
            {[
              { color: C.green,  label: '≥ 80% — Excellent' },
              { color: C.a1,     label: '≥ 50% — Good'      },
              { color: C.yellow, label: '≥ 30% — Fair'       },
              { color: C.red,    label: '< 30% — Needs help' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: C.t4 }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state for member stats */}
      {memberStats.length === 0 && (
        <Card title="Team Performance" icon={<Users size={13} color={C.a2} />}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: R.xl, background: C.bg0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color={C.t4} />
            </div>
            <p style={{ fontSize: '13px', color: C.t4 }}>No member data available yet</p>
            <p style={{ fontSize: '12px', color: C.t4, opacity: 0.7 }}>Assign tasks to team members to see performance stats</p>
          </div>
        </Card>
      )}
    </div>
  )
}
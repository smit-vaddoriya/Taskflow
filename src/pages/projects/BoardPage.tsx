import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Plus, LayoutGrid, List, Loader2, Lock } from 'lucide-react'
import apiClient from '../../services/apiClient'
import KanbanBoard from '../../components/board/KanbanBoard'
import { useUIStore } from '../../store/uiStore'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'
import type { Project } from '../../types'

export default function BoardPage() {
  const { projectId = '' } = useParams()
  const { openModal }      = useUIStore()
  const { can }            = usePermissions()
  const [view, setView]    = useState<'kanban' | 'list'>('kanban')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/projects/${projectId}`)
      return data.data as Project
    },
    enabled: !!projectId,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Loader2 size={20} color={C.a2} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!project) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
      <p style={{ fontSize: '14px', color: C.t4 }}>Project not found</p>
      <Link to="/projects" style={{ fontSize: '13px', color: C.a2 }}>← Back to projects</Link>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0 16px', height: '44px', flexShrink: 0,
        background: `${C.bg1}f0`, borderBottom: `1px solid ${C.b1}`,
        backdropFilter: 'blur(12px)',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <Link to="/projects" style={{ fontSize: '12px', color: C.t4, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.t2}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.t4}
          >Projects</Link>
          <ChevronRight size={11} color={C.t4} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: project.color, flexShrink: 0, boxShadow: `0 0 6px ${project.color}80` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </span>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: C.bg0, border: `1px solid ${C.b1}`, borderRadius: R.md, padding: '2px', gap: '1px' }}>
          {[{ id: 'kanban', Icon: LayoutGrid }, { id: 'list', Icon: List }].map(({ id, Icon }) => (
            <button key={id} onClick={() => setView(id as any)} style={{
              padding: '4px 7px', borderRadius: '5px',
              background: view === id ? C.bg2 : 'transparent',
              border: `1px solid ${view === id ? C.b2 : 'transparent'}`,
              cursor: 'pointer', color: view === id ? C.t2 : C.t4,
              display: 'flex', alignItems: 'center', transition: 'all 0.15s',
            }}>
              <Icon size={12} />
            </button>
          ))}
        </div>

        {/* Add Board — MANAGER+ only */}
        {can.createBoard && (
          <button onClick={() => openModal('createBoard')} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px',
            borderRadius: R.lg, background: 'transparent',
            border: `1px solid ${C.b2}`, color: C.t3,
            fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t1; e.currentTarget.style.borderColor = C.b3 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3; e.currentTarget.style.borderColor = C.b2 }}
          >
            <Plus size={12} /> Add Board
          </button>
        )}

        {/* New Task — MEMBER+ only */}
        {can.createTask ? (
          <button onClick={() => openModal('createTask')} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px',
            borderRadius: R.lg,
            background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
            border: `1px solid ${C.ab}`, color: 'white',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 2px 8px ${C.am}`, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
          >
            <Plus size={12} /> New Task
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: R.lg, background: C.bg0, border: `1px solid ${C.b1}`, color: C.t4, fontSize: '12px', fontWeight: 500 }}>
            <Lock size={11} /> View only
          </div>
        )}
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'kanban'
          ? <KanbanBoard projectId={projectId} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ fontSize: '13px', color: C.t4 }}>List view coming soon</p>
            </div>
        }
      </div>
    </div>
  )
}
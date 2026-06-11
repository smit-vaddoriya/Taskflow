import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Plus, Search, ArrowUpRight, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import Modal from '../../components/ui/Modal'
import { useProjects, useCreateProject } from '../../hooks/useOrg'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'
import type { CreateProjectForm } from '../../types'

const COLORS = ['#7c3aed','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4']

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects()
  const createProject = useCreateProject()
  const { can } = usePermissions()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch]         = useState('')
  const [color, setColor]           = useState(COLORS[0])
  const [searchFocused, setSearchFocused] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProjectForm>()

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && !p.isArchived
  )

  const onSubmit = async (data: CreateProjectForm) => {
    await createProject.mutateAsync({ ...data, color })
    reset()
    setShowCreate(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', marginBottom: '3px' }}>Projects</h1>
          <p style={{ fontSize: '12px', color: C.t4 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>

        {can.createProject ? (
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: R.lg, background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`, border: `1px solid ${C.ab}`, color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.am}`, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
          >
            <Plus size={14} /> New Project
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: R.lg, background: C.bg2, border: `1px solid ${C.b2}`, color: C.t4, fontSize: '12px' }}>
            <Lock size={12} /> View only
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '280px', marginBottom: '20px' }}>
        <Search size={13} color={searchFocused ? C.a2 : C.t4} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.15s' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{ width: '100%', background: searchFocused ? C.bg2 : C.bg1, border: `1px solid ${searchFocused ? C.a1 : C.b2}`, borderRadius: R.lg, padding: '8px 14px 8px 30px', fontSize: '13px', color: C.t1, outline: 'none', boxShadow: searchFocused ? `0 0 0 3px ${C.am}` : 'none', transition: 'all 0.2s' }}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '12px' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '130px', borderRadius: R.xl }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: C.bg2, borderRadius: R.xl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={22} color={C.t4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: C.t2, marginBottom: '4px' }}>{search ? 'No projects match' : 'No projects yet'}</p>
            <p style={{ fontSize: '13px', color: C.t4 }}>{search ? 'Try a different search term' : can.createProject ? 'Create your first project to get started' : 'No projects have been created yet'}</p>
          </div>
          {!search && can.createProject && (
            <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: R.lg, background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'white', boxShadow: `0 4px 12px ${C.am}` }}>
              <Plus size={14} /> Create project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '12px' }}>
          {filtered.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl, padding: '18px', transition: 'all 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${p.color}50`; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)` }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.b1; el.style.transform = 'none'; el.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: R.lg, background: `${p.color}18`, border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderKanban size={17} color={p.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{p.name}</p>
                    <p style={{ fontSize: '11px', color: C.t4, marginTop: '2px' }}>{p._count?.boards ?? 0} boards</p>
                  </div>
                  <ArrowUpRight size={14} color={C.t4} />
                </div>
                {p.description && (
                  <p style={{ fontSize: '12px', color: C.t3, lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '10px', borderTop: `1px solid ${C.b1}` }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.color, boxShadow: `0 0 5px ${p.color}` }} />
                  <span style={{ fontSize: '10px', color: C.t4 }}>{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create project modal */}
      {can.createProject && (
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create project" subtitle="Set up a new project for your team">
          <div style={{ padding: '20px 24px 24px' }}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Project name *</p>
                <input {...register('name', { required: true })} placeholder="e.g. Marketing Website" autoFocus
                  style={{ width: '100%', background: C.bg0, border: `1px solid ${errors.name ? C.red : C.b2}`, borderRadius: R.lg, padding: '10px 14px', fontSize: '13px', color: C.t1, outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = C.a1; e.target.style.boxShadow = `0 0 0 3px ${C.am}` }}
                  onBlur={e => { e.target.style.borderColor = errors.name ? C.red : C.b2; e.target.style.boxShadow = 'none' }}
                />
                {errors.name && <p style={{ fontSize: '11px', color: C.red, marginTop: '5px' }}>Name is required</p>}
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Description</p>
                <textarea {...register('description')} placeholder="What is this project about?" rows={3}
                  style={{ width: '100%', background: C.bg0, border: `1px solid ${C.b2}`, borderRadius: R.lg, padding: '10px 14px', fontSize: '13px', color: C.t1, outline: 'none', resize: 'none', lineHeight: 1.5 }}
                  onFocus={e => { e.target.style.borderColor = C.a1; e.target.style.boxShadow = `0 0 0 3px ${C.am}` }}
                  onBlur={e => { e.target.style.borderColor = C.b2; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Color</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '26px', height: '26px', borderRadius: R.md, background: c, border: `2px solid ${color === c ? 'white' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s', transform: color === c ? 'scale(1.2)' : 'scale(1)', boxShadow: color === c ? `0 0 10px ${c}70` : 'none' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', borderRadius: R.lg, background: 'transparent', border: `1px solid ${C.b2}`, color: C.t3, fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t1 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3 }}
                >Cancel</button>
                <button type="submit" disabled={createProject.isPending} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: R.lg, background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`, border: `1px solid ${C.ab}`, color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.am}`, opacity: createProject.isPending ? 0.8 : 1, transition: 'all 0.15s' }}>
                  {createProject.isPending ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}
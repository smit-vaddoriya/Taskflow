import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Calendar, Clock, User, Layers, Tag, Trash2,
  Send, Loader2, CheckSquare, MessageSquare,
  Activity, ChevronDown, Save, X,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import ActivityLog from './ActivityLog'
import AIBreakdownPanel from '../ai/AIBreakdownPanel'
import {
  useTask, useUpdateTask, useDeleteTask,
  useComments, useAddComment, useBoards,
} from '../../services/task.service'
import { useOrgMembers } from '../../hooks/useOrg'
import { useAuthStore } from '../../store/authStore'
import type { Priority, TaskStatus } from '../../types'

type Tab = 'comments' | 'activity' | 'ai'

const STATUSES: { value: TaskStatus; label: string; color: string; bg: string }[] = [
  { value: 'BACKLOG',     label: 'Backlog',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  { value: 'TODO',        label: 'To Do',       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  { value: 'IN_REVIEW',   label: 'In Review',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  { value: 'DONE',        label: 'Done',        color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  { value: 'CANCELLED',   label: 'Cancelled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
]

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'NONE',   label: 'No priority', color: '#4b5563', bg: 'rgba(75,85,99,0.12)'   },
  { value: 'LOW',    label: 'Low',         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'MEDIUM', label: 'Medium',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'HIGH',   label: 'High',        color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { value: 'URGENT', label: 'Urgent',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
]

// Maps status → board name keywords for auto-move
const STATUS_BOARD_KEYWORDS: Record<TaskStatus, string[]> = {
  BACKLOG:     ['backlog'],
  TODO:        ['todo', 'to do', 'to-do'],
  IN_PROGRESS: ['in progress', 'in-progress', 'progress', 'doing'],
  IN_REVIEW:   ['in review', 'in-review', 'review'],
  DONE:        ['done', 'completed', 'finished', 'complete'],
  CANCELLED:   ['cancelled', 'canceled'],
}

function SidebarSelect({ label, icon, value, options, onChange }: {
  label: string
  icon: React.ReactNode
  value: string
  options: { value: string; label: string; color: string; bg: string }[]
  onChange: (val: string) => void
}) {
  const sel = options.find(o => o.value === value) ?? options[0]
  return (
    <div>
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {icon} {label}
      </p>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '7px', height: '7px', borderRadius: '50%', background: sel.color, boxShadow: `0 0 6px ${sel.color}80`, pointerEvents: 'none', zIndex: 1 }} />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', background: sel.bg, border: `1px solid ${sel.color}40`, borderRadius: '9px', padding: '8px 28px 8px 24px', fontSize: '12px', fontWeight: 600, color: sel.color, outline: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
          onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
          onBlur={e => { e.target.style.borderColor = `${sel.color}40`; e.target.style.boxShadow = 'none' }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#111827', color: o.color, fontWeight: 600 }}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={11} color={sel.color} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

interface Props {
  taskId: string
  projectId?: string
  onClose: () => void
}

export default function TaskDetail({ taskId, projectId, onClose }: Props) {
  const { data: task, isLoading } = useTask(taskId)
  const { data: comments = [] }  = useComments(taskId)
  const { data: members = [] }   = useOrgMembers()
  const { data: boards = [] }    = useBoards(projectId ?? '')
  const updateTask  = useUpdateTask()
  const deleteTask  = useDeleteTask()
  const addComment  = useAddComment()
  const { user }    = useAuthStore()

  const [tab, setTab]           = useState<Tab>('comments')
  const [comment, setComment]   = useState('')
  const [descFocused, setDescFocused]       = useState(false)
  const [commentFocused, setCommentFocused] = useState(false)

  // ── Pending changes ──────────────────────────────────────
  const [pendingStatus,     setPendingStatus]     = useState<TaskStatus | null>(null)
  const [pendingPriority,   setPendingPriority]   = useState<Priority | null>(null)
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null>(null)
  const [pendingDesc,       setPendingDesc]       = useState<string | null>(null)

  // Reset pending when task changes
  useEffect(() => {
    if (task) {
      setPendingStatus(null)
      setPendingPriority(null)
      setPendingAssigneeId(null)
      setPendingDesc(null)
    }
  }, [task?.id])

  if (isLoading || !task) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px' }}>
      <Loader2 size={20} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '13px', color: '#374151' }}>Loading task...</span>
    </div>
  )

  const hasChanges = pendingStatus !== null || pendingPriority !== null || pendingAssigneeId !== null || pendingDesc !== null

  const currentStatus   = pendingStatus     ?? task.status
  const currentPriority = pendingPriority   ?? task.priority
  const currentAssignee = pendingAssigneeId !== null ? pendingAssigneeId : (task.assigneeId ?? '')

  const displayStatus   = STATUSES.find(s => s.value === currentStatus)!
  const displayPriority = PRIORITIES.find(p => p.value === currentPriority)!
  const assigneeMember  = members.find(m => m.userId === currentAssignee)

  // ── Find matching board for a status ─────────────────────
  const findBoardForStatus = (status: TaskStatus): string | null => {
    const keywords = STATUS_BOARD_KEYWORDS[status]
    const match = boards.find(b =>
      keywords.some(kw => b.name.toLowerCase().includes(kw))
    )
    return match?.id ?? null
  }

  // ── Discard all pending changes ───────────────────────────
  const discardChanges = () => {
    setPendingStatus(null)
    setPendingPriority(null)
    setPendingAssigneeId(null)
    setPendingDesc(null)
  }

  // ── Save + close ─────────────────────────────────────────
  const handleSave = async () => {
    const updates: Record<string, any> = {
      id: task.id,
      _previousBoardId: task.boardId, // for cache invalidation in service
    }

    if (pendingDesc !== null)       updates.description = pendingDesc
    if (pendingPriority !== null)   updates.priority    = pendingPriority
    if (pendingAssigneeId !== null) updates.assigneeId  = pendingAssigneeId || null

    if (pendingStatus !== null) {
      updates.status = pendingStatus
      // Auto-move to matching board column
      const targetBoardId = findBoardForStatus(pendingStatus)
      if (targetBoardId && targetBoardId !== task.boardId) {
        updates.boardId = targetBoardId
      }
    }

    await updateTask.mutateAsync(updates)

    // Close modal after save so board refreshes are visible
    onClose()
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return
    await deleteTask.mutateAsync({ id: task.id, boardId: task.boardId })
    onClose()
  }

  // ── Submit comment ────────────────────────────────────────
  const submitComment = () => {
    if (!comment.trim()) return
    addComment.mutate({ taskId, content: comment })
    setComment('')
  }

  return (
    <div style={{ display: 'flex', minHeight: '580px', maxHeight: '85vh' }}>

      {/* ════ LEFT: Main content ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid #141b2d' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
            <h2 style={{ flex: 1, fontSize: '18px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.35, letterSpacing: '-0.03em' }}>
              {task.title}
            </h2>
            <button
              onClick={handleDelete}
              title="Delete task"
              style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#252d3d', borderRadius: '7px', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#252d3d' }}
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Current status/priority badges (reflect pending changes immediately) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: displayStatus.bg, color: displayStatus.color, border: `1px solid ${displayStatus.color}30` }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: displayStatus.color }} />
              {displayStatus.label}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: displayPriority.bg, color: displayPriority.color, border: `1px solid ${displayPriority.color}30` }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: displayPriority.color }} />
              {displayPriority.label}
            </span>
            {task.dueDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#4b5563', padding: '4px 10px', borderRadius: '99px', background: 'rgba(75,85,99,0.1)', border: '1px solid rgba(75,85,99,0.2)' }}>
                <Calendar size={10} />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #141b2d' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Description
          </p>
          <textarea
            value={pendingDesc ?? task.description ?? ''}
            placeholder="Add a description..."
            rows={3}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            onChange={e => setPendingDesc(e.target.value)}
            style={{
              width: '100%', background: descFocused ? '#141b2d' : 'transparent',
              border: `1px solid ${descFocused ? '#7c3aed' : 'transparent'}`,
              borderRadius: '9px', padding: '10px 12px',
              fontSize: '13px', color: '#9ca3af', outline: 'none',
              resize: 'none', lineHeight: 1.6, transition: 'all 0.2s',
              boxShadow: descFocused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
            }}
            onMouseEnter={e => { if (!descFocused) (e.currentTarget as HTMLElement).style.borderColor = '#1e2a3a' }}
            onMouseLeave={e => { if (!descFocused) (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
          />
        </div>

        {/* Subtasks */}
        {task.subTasks && task.subTasks.length > 0 && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #141b2d' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckSquare size={11} />
              Subtasks ({task.subTasks.filter(s => s.status === 'DONE').length}/{task.subTasks.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {task.subTasks.map(sub => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: '#0d1117', border: '1px solid #141b2d' }}>
                  <input
                    type="checkbox"
                    checked={sub.status === 'DONE'}
                    onChange={e => updateTask.mutate({ id: sub.id, status: e.target.checked ? 'DONE' : 'TODO', _previousBoardId: sub.boardId } as any)}
                    style={{ accentColor: '#7c3aed', width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: sub.status === 'DONE' ? '#374151' : '#9ca3af', textDecoration: sub.status === 'DONE' ? 'line-through' : 'none' }}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #141b2d', padding: '0 24px', flexShrink: 0 }}>
          {([
            { id: 'comments', label: 'Comments', icon: <MessageSquare size={12} /> },
            { id: 'activity', label: 'Activity',  icon: <Activity size={12} /> },
            { id: 'ai',       label: '✨ AI Tools', icon: null },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '12px 14px', fontSize: '12px', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.id ? '#a78bfa' : '#374151',
                borderBottom: `2px solid ${tab === t.id ? '#7c3aed' : 'transparent'}`,
                marginBottom: '-1px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = '#6b7280' }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = '#374151' }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {comments.length === 0 && (
                <p style={{ fontSize: '13px', color: '#252d3d', textAlign: 'center', padding: '20px 0' }}>
                  No comments yet. Be the first!
                </p>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                  <Avatar name={c.author.name} src={c.author.avatarUrl} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>{c.author.name}</span>
                      <span style={{ fontSize: '11px', color: '#252d3d' }}>{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#9ca3af', background: '#0d1117', borderRadius: '10px', padding: '10px 13px', border: '1px solid #141b2d', lineHeight: 1.55 }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size="sm" />
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <input
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onFocus={() => setCommentFocused(true)}
                    onBlur={() => setCommentFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                    placeholder="Write a comment..."
                    style={{
                      flex: 1, background: commentFocused ? '#141b2d' : '#0d1117',
                      border: `1px solid ${commentFocused ? '#7c3aed' : '#1e2a3a'}`,
                      borderRadius: '9px', padding: '9px 13px',
                      fontSize: '13px', color: '#e2e8f0', outline: 'none', transition: 'all 0.2s',
                      boxShadow: commentFocused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
                    }}
                  />
                  <button
                    onClick={submitComment}
                    disabled={!comment.trim() || addComment.isPending}
                    style={{
                      width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, border: 'none',
                      background: comment.trim() ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : '#141b2d',
                      cursor: comment.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      boxShadow: comment.trim() ? '0 2px 8px rgba(124,58,237,0.4)' : 'none',
                    }}
                    onMouseEnter={e => { if (comment.trim()) e.currentTarget.style.filter = 'brightness(1.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                  >
                    <Send size={14} color={comment.trim() ? 'white' : '#374151'} />
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === 'activity' && <ActivityLog taskId={taskId} />}
          {tab === 'ai'       && <AIBreakdownPanel task={task} />}
        </div>
      </div>

      {/* ════ RIGHT: Sidebar ════ */}
      <div style={{
        width: '224px', flexShrink: 0,
        borderLeft: '1px solid #141b2d',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: '#0d1117',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <SidebarSelect
            label="Status" icon={<Tag size={10} />}
            value={currentStatus}
            options={STATUSES}
            onChange={val => setPendingStatus(val as TaskStatus)}
          />

          <SidebarSelect
            label="Priority" icon={<Layers size={10} />}
            value={currentPriority}
            options={PRIORITIES}
            onChange={val => setPendingPriority(val as Priority)}
          />

          {/* Assignee */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={10} /> Assignee
            </p>
            <div style={{ position: 'relative' }}>
              {assigneeMember && (
                <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
                  <Avatar name={assigneeMember.user.name} src={assigneeMember.user.avatarUrl} size="xs" />
                </div>
              )}
              {!assigneeMember && (
                <User size={12} color="#374151" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              )}
              <select
                value={currentAssignee}
                onChange={e => setPendingAssigneeId(e.target.value)}
                style={{
                  width: '100%', appearance: 'none', WebkitAppearance: 'none',
                  background: '#111827', border: '1px solid #1e2a3a',
                  borderRadius: '9px', padding: '8px 24px 8px 28px',
                  fontSize: '12px', fontWeight: 500,
                  color: assigneeMember ? '#e2e8f0' : '#4b5563',
                  outline: 'none', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#1e2a3a'; e.target.style.boxShadow = 'none' }}
              >
                <option value="" style={{ background: '#111827', color: '#6b7280' }}>Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId} style={{ background: '#111827', color: '#e2e8f0' }}>
                    {m.user.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} color="#374151" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ height: '1px', background: '#141b2d' }} />

          {task.estimatedHours && (
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={10} /> Estimate
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>{task.estimatedHours}h</p>
            </div>
          )}

          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={10} /> Created
            </p>
            <p style={{ fontSize: '12px', color: '#4b5563' }}>{format(new Date(task.createdAt), 'MMM d, yyyy')}</p>
          </div>

          {task.createdBy && (
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={10} /> Created by
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Avatar name={task.createdBy.name} size="xs" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{task.createdBy.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #141b2d', background: '#0d1117', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Unsaved changes indicator */}
          {hasChanges && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.6)', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 500 }}>Unsaved changes</span>
            </div>
          )}

          {hasChanges ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Discard */}
              <button
                onClick={discardChanges}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                  background: 'transparent', border: '1px solid #1e2a3a', color: '#4b5563',
                  cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#141b2d'; e.currentTarget.style.color = '#6b7280' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}
              >
                <X size={11} /> Discard
              </button>

              {/* Save + close */}
              <button
                onClick={handleSave}
                disabled={updateTask.isPending}
                style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  border: '1px solid rgba(124,58,237,0.4)', color: 'white',
                  cursor: updateTask.isPending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(124,58,237,0.4)', transition: 'all 0.15s',
                  opacity: updateTask.isPending ? 0.8 : 1,
                }}
                onMouseEnter={e => { if (!updateTask.isPending) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
              >
                {updateTask.isPending
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : <><Save size={12} /> Save & close</>
                }
              </button>
            </div>
          ) : (
            /* No pending changes — show close button */
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                background: 'transparent', border: '1px solid #1e2a3a', color: '#374151',
                cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#141b2d'; e.currentTarget.style.color = '#6b7280' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151' }}
            >
              <X size={13} /> Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlignLeft, CalendarDays, Clock, User, Tag,
  AlertCircle, CheckCircle, ArrowUpCircle, MinusCircle,
  ChevronDown, Zap,
} from 'lucide-react'
import { useCreateTask, useUpdateTask } from '../../services/task.service'
import { useOrgMembers } from '../../hooks/useOrg'
import Avatar from '../ui/Avatar'
import type { Task, Priority, TaskStatus } from '../../types'

const schema = z.object({
  title:          z.string().min(1, 'Title is required').max(255),
  description:    z.string().optional(),
  priority:       z.enum(['NONE','LOW','MEDIUM','HIGH','URGENT']),
  status:         z.enum(['BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','DONE','CANCELLED']),
  dueDate:        z.string().optional(),
  assigneeId:     z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
})

type FormData = z.infer<typeof schema>

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'NONE',   label: 'No priority', color: '#4b5563', bg: 'rgba(75,85,99,0.12)'     },
  { value: 'LOW',    label: 'Low',         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'   },
  { value: 'MEDIUM', label: 'Medium',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'   },
  { value: 'HIGH',   label: 'High',        color: '#f97316', bg: 'rgba(249,115,22,0.12)'   },
  { value: 'URGENT', label: 'Urgent',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'    },
]

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'BACKLOG',     label: 'Backlog',      color: '#4b5563' },
  { value: 'TODO',        label: 'To Do',        color: '#94a3b8' },
  { value: 'IN_PROGRESS', label: 'In Progress',  color: '#3b82f6' },
  { value: 'IN_REVIEW',   label: 'In Review',    color: '#8b5cf6' },
  { value: 'DONE',        label: 'Done',         color: '#10b981' },
  { value: 'CANCELLED',   label: 'Cancelled',    color: '#ef4444' },
]

interface Props {
  boardId: string
  projectId: string
  task?: Task
  onSuccess: () => void
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
      {children}
    </p>
  )
}

function InputField({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && (
        <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}

export default function TaskForm({ boardId, projectId, task, onSuccess }: Props) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: members = [] } = useOrgMembers()
  const isEditing = !!task
  const [titleFocused, setTitleFocused] = useState(false)
  const [descFocused, setDescFocused] = useState(false)

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:          task?.title ?? '',
      description:    task?.description ?? '',
      priority:       task?.priority ?? 'NONE',
      status:         task?.status ?? 'TODO',
      dueDate:        task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId:     task?.assigneeId ?? '',
      estimatedHours: task?.estimatedHours,
    },
  })

  const watchPriority   = watch('priority')
  const watchStatus     = watch('status')
  const watchAssigneeId = watch('assigneeId')

  const selectedPriority = PRIORITIES.find(p => p.value === watchPriority)!
  const selectedStatus   = STATUSES.find(s => s.value === watchStatus)!
  const selectedMember   = members.find(m => m.userId === watchAssigneeId)

  const onSubmit = async (data: FormData) => {
    if (isEditing) await updateTask.mutateAsync({ id: task!.id, ...data })
    else await createTask.mutateAsync({ boardId, ...data } as any)
    onSuccess()
  }

  const fieldStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%', outline: 'none', transition: 'all 0.2s',
    background: focused ? '#141b2d' : '#0d1117',
    border: `1px solid ${focused ? '#7c3aed' : '#1e2a3a'}`,
    borderRadius: '10px', color: '#e2e8f0', fontSize: '13px',
    boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
  })

  const selectStyle: React.CSSProperties = {
    width: '100%', outline: 'none', cursor: 'pointer',
    background: '#0d1117', border: '1px solid #1e2a3a',
    borderRadius: '10px', color: '#e2e8f0', fontSize: '13px',
    padding: '10px 14px', transition: 'all 0.2s',
    appearance: 'none', WebkitAppearance: 'none',
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Title — most prominent field */}
        <div style={{ padding: '24px 24px 0' }}>
          <InputField error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="What needs to be done?"
              autoFocus
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              style={{
                ...fieldStyle(titleFocused),
                padding: '13px 16px',
                fontSize: '16px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            />
          </InputField>
        </div>

        {/* Description */}
        <div style={{ padding: '14px 24px 0' }}>
          <textarea
            {...register('description')}
            placeholder="Add a description... (optional)"
            rows={3}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            style={{
              ...fieldStyle(descFocused),
              padding: '11px 14px',
              resize: 'none',
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#141b2d', margin: '18px 0 0' }} />

        {/* Options grid */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Priority + Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Priority */}
            <div>
              <Label>Priority</Label>
              <div style={{ position: 'relative' }}>
                <select
                  {...register('priority')}
                  style={{
                    ...selectStyle,
                    paddingLeft: '36px',
                    borderColor: selectedPriority.color + '50',
                    background: selectedPriority.bg,
                    color: selectedPriority.color,
                    fontWeight: 600, fontSize: '12px',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = selectedPriority.color + '50'; e.target.style.boxShadow = 'none' }}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value} style={{ background: '#111827', color: p.color }}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: selectedPriority.color, boxShadow: `0 0 8px ${selectedPriority.color}80`, pointerEvents: 'none' }} />
                <ChevronDown size={12} color={selectedPriority.color} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <div style={{ position: 'relative' }}>
                <select
                  {...register('status')}
                  style={{
                    ...selectStyle,
                    paddingLeft: '36px',
                    fontWeight: 600, fontSize: '12px',
                    color: selectedStatus.color,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#1e2a3a'; e.target.style.boxShadow = 'none' }}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value} style={{ background: '#111827', color: s.color }}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: selectedStatus.color, pointerEvents: 'none' }} />
                <ChevronDown size={12} color={selectedStatus.color} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <Label>Assignee</Label>
            <div style={{ position: 'relative' }}>
              {selectedMember && (
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, pointerEvents: 'none' }}>
                  <Avatar name={selectedMember.user.name} src={selectedMember.user.avatarUrl} size="xs" />
                </div>
              )}
              {!selectedMember && (
                <User size={13} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              )}
              <select
                {...register('assigneeId')}
                style={{
                  ...selectStyle,
                  paddingLeft: '34px',
                  color: selectedMember ? '#e2e8f0' : '#4b5563',
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
              <ChevronDown size={12} color="#374151" style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Due date + Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label>Due date</Label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={13} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="date"
                  {...register('dueDate')}
                  style={{ ...selectStyle, paddingLeft: '34px', colorScheme: 'dark' }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#1e2a3a'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <div>
              <Label>Est. hours</Label>
              <div style={{ position: 'relative' }}>
                <Clock size={13} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="number" step="0.5" min="0"
                  {...register('estimatedHours')}
                  placeholder="e.g. 4"
                  style={{ ...selectStyle, paddingLeft: '34px' }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#1e2a3a'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderTop: '1px solid #141b2d',
          background: '#0d1117',
        }}>
          <p style={{ fontSize: '11px', color: '#252d3d' }}>
            Press <kbd style={{ fontSize: '10px', color: '#374151', background: '#141b2d', padding: '2px 5px', borderRadius: '4px', border: '1px solid #1e2a3a' }}>Enter</kbd> to submit
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onSuccess}
              style={{
                padding: '8px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
                background: 'transparent', border: '1px solid #1e2a3a', color: '#6b7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#141b2d'; e.currentTarget.style.color = '#9ca3af' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700,
                background: isPending ? '#4c1d95' : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                border: '1px solid rgba(124,58,237,0.4)', color: 'white',
                cursor: isPending ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
                transition: 'all 0.15s', letterSpacing: '-0.01em',
                opacity: isPending ? 0.8 : 1,
              }}
              onMouseEnter={e => { if (!isPending) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.6)' } }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,58,237,0.4)' }}
            >
              {isPending ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="animate-spin">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
                    <path d="M11.5 6.5A5 5 0 0 0 6.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Save changes' : 'Create task'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
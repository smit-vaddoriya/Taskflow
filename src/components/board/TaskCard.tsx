import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Paperclip, Calendar, Zap } from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import Avatar from '../ui/Avatar'
import { useUIStore } from '../../store/uiStore'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'
import type { Task, Priority } from '../../types'

const priorityColors: Record<Priority, string> = {
  NONE: 'transparent', LOW: C.blue, MEDIUM: C.yellow, HIGH: C.orange, URGENT: C.red,
}

export default function TaskCard({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const { setSelectedTask, openModal } = useUIStore()
  const { can } = usePermissions()
  const [hovered, setHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !can.dragTask,  // disable drag for VIEWER
  })

  const isOverdue   = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'
  const isDueToday  = task.dueDate && isToday(new Date(task.dueDate))
  const isDueTomoro = task.dueDate && isTomorrow(new Date(task.dueDate))

  const dueDateStyle: React.CSSProperties = isOverdue
    ? { color: C.red, background: C.redM }
    : isDueToday ? { color: C.yellow, background: C.yellowM }
    : isDueTomoro ? { color: C.orange, background: C.orangeM }
    : { color: C.t4 }

  const done         = task.status === 'DONE'
  const subtasksDone = task.subTasks?.filter(s => s.status === 'DONE').length ?? 0
  const subtasksT    = task.subTasks?.length ?? 0
  const pct          = subtasksT > 0 ? (subtasksDone / subtasksT) * 100 : 0
  const pColor       = priorityColors[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...(can.dragTask ? listeners : {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={e => { e.stopPropagation(); setSelectedTask(task.id); openModal('taskDetail') }}
    >
      <div style={{
        position: 'relative',
        background: hovered ? C.bg3 : C.bg2,
        border: `1px solid ${hovered ? C.b2 : C.b1}`,
        borderRadius: R.xl, padding: '11px 12px 11px 15px',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
        boxShadow: isDragging
          ? `0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px ${C.a1}40`
          : hovered ? `${C.shadowCard}, 0 4px 12px rgba(0,0,0,0.3)` : C.shadowCard,
        opacity: isDragging ? 0.3 : 1,
        transform: overlay ? 'rotate(2deg) scale(1.03)' : 'none',
        userSelect: 'none',
      }}>
        {/* Priority stripe */}
        {task.priority !== 'NONE' && (
          <div style={{ position: 'absolute', left: 0, top: '10px', bottom: '10px', width: '2.5px', borderRadius: '0 2px 2px 0', background: pColor, boxShadow: `0 0 8px ${pColor}80` }} />
        )}

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '7px' }}>
            {task.labels.slice(0, 3).map(({ label }) => (
              <span key={label.id} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: R.full, fontWeight: 500, background: `${label.color}18`, color: label.color, border: `1px solid ${label.color}30` }}>
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <p style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.45, marginBottom: '9px', color: done ? C.t4 : hovered ? C.t1 : C.t2, textDecoration: done ? 'line-through' : 'none', transition: 'color 0.12s' }}>
          {task.title}
        </p>

        {/* AI suggestion */}
        {task.aiSuggestedPriority && task.aiSuggestedPriority !== task.priority && !done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '7px', fontSize: '10px', color: C.yellow, background: C.yellowM, border: `1px solid ${C.yellow}20`, borderRadius: R.sm, padding: '3px 8px' }}>
            <Zap size={9} /> AI: try {task.aiSuggestedPriority.toLowerCase()} priority
          </div>
        )}

        {/* Subtask progress */}
        {subtasksT > 0 && (
          <div style={{ marginBottom: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.t4, marginBottom: '4px' }}>
              <span>Subtasks</span>
              <span style={{ fontWeight: 500 }}>{subtasksDone}/{subtasksT}</span>
            </div>
            <div style={{ height: '2px', background: C.bg4, borderRadius: R.full, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: R.full, width: `${pct}%`, transition: 'width 0.4s ease', background: pct === 100 ? C.green : C.a1 }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(task._count?.comments ?? 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: C.t4 }}>
                <MessageSquare size={10} />{task._count!.comments}
              </span>
            )}
            {(task._count?.attachments ?? 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: C.t4 }}>
                <Paperclip size={10} />{task._count!.attachments}
              </span>
            )}
            {task.dueDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '2px 5px', borderRadius: R.sm, ...dueDateStyle }}>
                <Calendar size={9} />
                {isOverdue ? 'Overdue' : isDueToday ? 'Today' : isDueTomoro ? 'Tomorrow' : format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {task.assignee && <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="xs" />}
        </div>
      </div>
    </div>
  )
}
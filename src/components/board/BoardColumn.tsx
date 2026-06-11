import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import TaskCard from './TaskCard'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'
import type { Board, Task } from '../../types'

export default function BoardColumn({ board, tasks, onAddTask }: {
  board: Board; tasks: Task[]; onAddTask: (boardId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: board.id })
  const [menuOpen, setMenuOpen] = useState(false)
  const { can } = usePermissions()

  const done = tasks.filter(t => t.status === 'DONE').length
  const pct  = tasks.length > 0 ? (done / tasks.length) * 100 : 0
  const col  = board.color ?? C.a1

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '268px', flexShrink: 0,
      background: isOver ? `${C.a1}08` : C.bg1,
      border: `1px solid ${isOver ? C.ab : C.b1}`,
      borderRadius: R['2xl'],
      transition: 'background 0.15s, border-color 0.15s',
      boxShadow: isOver ? `0 0 0 1px ${C.ab}, inset 0 0 20px ${C.am}` : 'none',
    }}>

      {/* Column header */}
      <div style={{ padding: '13px 13px 9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: col, flexShrink: 0, boxShadow: `0 0 7px ${col}` }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {board.name}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.t4, background: C.bg0, padding: '1px 6px', borderRadius: R.full, border: `1px solid ${C.b1}`, flexShrink: 0 }}>
              {tasks.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
            {/* Add task — MEMBER+ */}
            {can.createTask && (
              <button onClick={() => onAddTask(board.id)} style={{ width: '22px', height: '22px', borderRadius: R.md, background: 'transparent', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t2 }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}>
                <Plus size={13} />
              </button>
            )}

            {/* Board menu — MANAGER+ */}
            {can.editBoard && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: '22px', height: '22px', borderRadius: R.md, background: 'transparent', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t2 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}>
                  <MoreHorizontal size={13} />
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', width: '140px', background: C.bg2, border: `1px solid ${C.b2}`, borderRadius: R.xl, overflow: 'hidden', zIndex: 20, boxShadow: C.shadowElevated, animation: 'scaleIn 0.12s ease-out' }}>
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.t2, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    ><Edit2 size={11} /> Rename</button>
                    {can.deleteBoard && (
                      <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.red, transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${C.red}10`}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      ><Trash2 size={11} /> Delete board</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        {tasks.length > 0 && (
          <div style={{ height: '2px', background: C.bg0, borderRadius: R.full, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? C.green : col, borderRadius: R.full, transition: 'width 0.5s ease', boxShadow: pct > 0 ? `0 0 6px ${col}60` : 'none' }} />
          </div>
        )}
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 10px', display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '80px' }}>
          {tasks.map(t => <TaskCard key={t.id} task={t} />)}
          {tasks.length === 0 && (
            <div
              onClick={() => can.createTask && onAddTask(board.id)}
              style={{
                minHeight: '60px', borderRadius: R.xl,
                border: `1px dashed ${C.b1}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: C.t4,
                cursor: can.createTask ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (can.createTask) { (e.currentTarget as HTMLElement).style.borderColor = C.b3; (e.currentTarget as HTMLElement).style.color = C.t3 } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.b1; (e.currentTarget as HTMLElement).style.color = C.t4 }}
            >
              {can.createTask ? 'Drop or click to add' : 'No tasks'}
            </div>
          )}
        </div>
      </SortableContext>

      {/* Footer add button — MEMBER+ only */}
      {can.createTask && (
        <div style={{ padding: '4px 10px 10px' }}>
          <button onClick={() => onAddTask(board.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: R.lg, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.t4, transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t2 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}
          >
            <Plus size={12} /> Add task
          </button>
        </div>
      )}
    </div>
  )
}
import React, { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Plus, Loader2 } from 'lucide-react'
import BoardColumn from './BoardColumn'
import TaskCard from './TaskCard'
import Modal from '../ui/Modal'
import TaskForm from '../tasks/TaskForm'
import TaskDetail from '../tasks/TaskDetail'
import { useBoards, useTasks, useUpdateTask } from '../../services/task.service'
import { useUIStore } from '../../store/uiStore'
import { usePermissions } from '../../hooks/usePermissions'
import { C, R } from '../../design/tokens'
import type { Task, Board } from '../../types'

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: boards = [], isLoading } = useBoards(projectId)
  const { activeModal, openModal, closeModal, selectedTaskId } = useUIStore()
  const updateTask = useUpdateTask()
  const { can } = usePermissions()
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState('')

  // Disable drag sensor entirely for viewers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: can.dragTask ? 8 : 999999 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (!can.dragTask) return
    const task = boards.flatMap(b => b.tasks ?? []).find(t => t.id === event.active.id)
    setActiveDragTask(task ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null)
    if (!can.dragTask) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const isOverColumn = boards.some(b => b.id === over.id)
    if (isOverColumn) {
      updateTask.mutate({ id: active.id as string, boardId: over.id as string, _previousBoardId: (activeDragTask?.boardId ?? '') } as any)
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
      <Loader2 size={18} color={C.a2} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '12px', color: C.t4 }}>Loading boards...</p>
    </div>
  )

  if (boards.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', background: C.am, borderRadius: R.xl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={20} color={C.a2} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: C.t2, marginBottom: '4px' }}>No boards yet</p>
        <p style={{ fontSize: '12px', color: C.t4 }}>
          {can.createBoard ? 'Create your first board to start organizing tasks' : 'No boards have been created yet'}
        </p>
      </div>
      {can.createBoard && (
        <button
          onClick={() => openModal('createBoard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: R.lg, background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'white', boxShadow: `0 4px 12px ${C.am}` }}
        >
          <Plus size={14} /> Create Board
        </button>
      )}
    </div>
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex', gap: '14px', padding: '20px',
          overflowX: 'auto', height: '100%', alignItems: 'flex-start',
        }}>
          {boards.map(board => (
            <BoardColumnWithTasks
              key={board.id}
              board={board}
              onAddTask={(id) => {
                if (!can.createTask) return
                setSelectedBoardId(id)
                openModal('createTask')
              }}
            />
          ))}

          {/* Add board button — MANAGER+ only */}
          {can.createBoard && (
            <button
              onClick={() => openModal('createBoard')}
              style={{
                flexShrink: 0, width: '260px',
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '14px 16px', borderRadius: R['2xl'],
                border: `1px dashed ${C.b2}`, background: 'transparent',
                color: C.t4, fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.a1; e.currentTarget.style.color = C.a2; e.currentTarget.style.background = C.am }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.b2; e.currentTarget.style.color = C.t4; e.currentTarget.style.background = 'transparent' }}
            >
              <Plus size={14} /> Add Board
            </button>
          )}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDragTask && <TaskCard task={activeDragTask} overlay />}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      <Modal isOpen={activeModal === 'createTask'} onClose={closeModal} title="New Task" subtitle="Add a task to your board" size="md">
        <TaskForm boardId={selectedBoardId} projectId={projectId} onSuccess={closeModal} />
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={activeModal === 'taskDetail'} onClose={closeModal} size="full">
        {selectedTaskId && <TaskDetail taskId={selectedTaskId} projectId={projectId} onClose={closeModal} />}
      </Modal>
    </>
  )
}

function BoardColumnWithTasks({ board, onAddTask }: { board: Board; onAddTask: (id: string) => void }) {
  const { data: tasks = [] } = useTasks(board.id)
  return <BoardColumn board={board} tasks={tasks} onAddTask={onAddTask} />
}
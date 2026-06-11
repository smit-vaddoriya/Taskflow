import React, { useState } from 'react'
import { Zap, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useAITaskBreakdown, useAIPrioritySuggest } from '../../services/ai.service'
import { useUpdateTask } from '../../services/task.service'
import { PriorityBadge } from '../ui/Badge'
import Button from '../ui/Button'
import type { Task, AISubTask } from '../../types'

export default function AIBreakdownPanel({ task }: { task: Task }) {
  const breakdown   = useAITaskBreakdown()
  const prioritySug = useAIPrioritySuggest()
  const updateTask  = useUpdateTask()
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> AI Task Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Break this task into subtasks with estimates</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => breakdown.mutate({ title: task.title, description: task.description ?? '' })} loading={breakdown.isPending} icon={<Zap className="w-3.5 h-3.5 text-yellow-400" />}>Generate</Button>
        </div>

        {breakdown.data && (
          <div className="space-y-3 mt-4">
            <div className="bg-dark-900 rounded-lg p-3 border border-dark-700">
              <p className="text-xs text-slate-400">{breakdown.data.summary}</p>
              <p className="text-xs text-primary-400 mt-1 font-medium">Total: {breakdown.data.totalEstimatedHours}h</p>
            </div>
            {breakdown.data.subTasks.map((sub: AISubTask, i: number) => (
              <div key={i} className="bg-dark-900 rounded-lg border border-dark-700 overflow-hidden">
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PriorityBadge priority={sub.priority} />
                    <span className="text-sm text-slate-200 truncate">{sub.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">{sub.estimatedHours}h</span>
                    {expanded === i ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                </button>
                {expanded === i && (
                  <div className="px-3 pb-3 border-t border-dark-700">
                    <p className="text-xs text-slate-400 mt-2">{sub.description}</p>
                    <button className="mt-2 flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"><Plus className="w-3 h-3" /> Add as subtask</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {breakdown.isError && <p className="text-xs text-red-400 mt-2">Failed. Check your Groq API key.</p>}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> Smart Priority</h3>
            <p className="text-xs text-slate-500 mt-0.5">AI suggests the right priority</p>
          </div>
          <Button size="sm" variant="secondary" loading={prioritySug.isPending}
            onClick={() => prioritySug.mutate({ taskTitle: task.title, dueDate: task.dueDate, assigneeWorkload: 0, dependencyCount: 0 })}>
            Suggest
          </Button>
        </div>

        {prioritySug.data && (
          <div className="bg-dark-900 rounded-lg p-3 border border-dark-700 mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-slate-500 mb-1">Suggested</p><PriorityBadge priority={prioritySug.data.suggestedPriority} /></div>
              <div className="text-right"><p className="text-xs text-slate-500 mb-1">Confidence</p><p className="text-sm font-semibold text-slate-200">{Math.round(prioritySug.data.confidence * 100)}%</p></div>
            </div>
            <p className="text-xs text-slate-400">{prioritySug.data.reasoning}</p>
            {prioritySug.data.suggestedPriority !== task.priority && (
              <Button size="sm" onClick={() => updateTask.mutate({ id: task.id, priority: prioritySug.data.suggestedPriority })} loading={updateTask.isPending}>Apply</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
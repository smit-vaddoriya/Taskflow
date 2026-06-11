import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { useTaskActivity } from '../../services/task.service'

const actionLabels: Record<string, string> = {
  status_changed: 'changed status', priority_changed: 'changed priority',
  assigned: 'assigned task', created: 'created this task',
}

export default function ActivityLog({ taskId }: { taskId: string }) {
  const { data: logs = [], isLoading } = useTaskActivity(taskId)

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
  if (logs.length === 0) return <p className="text-sm text-slate-500 py-4">No activity yet.</p>

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3">
          <Avatar name={log.user.name} src={log.user.avatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300">
              <span className="font-medium text-slate-200">{log.user.name}</span>{' '}
              {actionLabels[log.action] ?? log.action}
              {log.oldValue && log.newValue && (
                <span> from <span className="text-slate-400 line-through">{log.oldValue.replace('_',' ').toLowerCase()}</span> to <span className="text-primary-400">{log.newValue.replace('_',' ').toLowerCase()}</span></span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
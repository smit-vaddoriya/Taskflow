import React, { useState, useRef, useEffect } from 'react'
import { Zap, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { clsx } from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface TaskContext {
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  doneTasks: number
  overdueTasks: number
  myTasks: { title: string; status: string; priority: string; dueDate?: string }[]
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your TaskFlow AI assistant. Ask me anything about your tasks — like 'show me todo tasks', 'what's overdue?', or 'create a task to fix the login bug'.",
      timestamp: new Date(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, currentOrg } = useAuthStore()

  // Fetch task context for AI
  const { data: taskContext } = useQuery({
    queryKey: ['ai-task-context', currentOrg?.id],
    queryFn: async (): Promise<TaskContext> => {
      const { data } = await apiClient.get('/analytics/overview')
      const overview = data.data

      const { data: tasksData } = await apiClient.get(
        `/tasks?assigneeId=${user?.id}`
      )
      const myTasks = tasksData.data.slice(0, 20).map((t: any) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      }))

      return {
        totalTasks: overview.totalTasks,
        todoTasks: overview.totalTasks - overview.completedTasks - overview.inProgressTasks,
        inProgressTasks: overview.inProgressTasks,
        doneTasks: overview.completedTasks,
        overdueTasks: overview.overdueTasks,
        myTasks,
      }
    },
    enabled: !!currentOrg && isOpen,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const systemPrompt = `You are TaskFlow AI assistant — a helpful project management assistant.
You have access to the user's task data:
- Total tasks: ${taskContext?.totalTasks ?? 0}
- Todo tasks: ${taskContext?.todoTasks ?? 0}
- In Progress: ${taskContext?.inProgressTasks ?? 0}
- Completed: ${taskContext?.doneTasks ?? 0}
- Overdue: ${taskContext?.overdueTasks ?? 0}
- User's assigned tasks: ${JSON.stringify(taskContext?.myTasks ?? [])}

Answer questions about their tasks naturally and helpfully.
If they want to CREATE a task, tell them to use the "AI Task" button in the navbar.
Keep responses concise and friendly. Use bullet points for lists.`

      const { data } = await apiClient.post('/ai/chat', {
        systemPrompt,
        message: input.trim(),
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I had trouble connecting. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-900/50 transition-all hover:scale-110 z-50"
        title="Open AI Assistant"
      >
        <Zap className="w-6 h-6 text-white" />
      </button>
    )
  }

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-50 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl flex flex-col transition-all',
        isMinimized ? 'w-72 h-14' : 'w-96 h-[520px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-primary-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-200">TaskFlow AI</p>
          {!isMinimized && <p className="text-xs text-slate-500">Ask me about your tasks</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-dark-700 rounded-lg transition-all"
          >
            {isMinimized
              ? <Maximize2 className="w-3.5 h-3.5" />
              : <Minimize2 className="w-3.5 h-3.5" />
            }
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-dark-700 rounded-lg transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-primary-400" />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-dark-900 text-slate-300 rounded-tl-sm'
                  )}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3 h-3 text-primary-400" />
                </div>
                <div className="bg-dark-900 rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
            {['Show todo tasks', "What's overdue?", 'My tasks today'].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); }}
                className="text-xs text-slate-400 bg-dark-900 hover:bg-dark-700 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 pt-2 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about your tasks..."
                className="input flex-1 text-sm py-2"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
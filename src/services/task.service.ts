import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from './apiClient'
import type { Task, CreateTaskForm, Board, Comment, ActivityLog } from '../types'

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: ['boards', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/boards?projectId=${projectId}`)
      return data.data as Board[]
    },
    enabled: !!projectId,
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { projectId: string; name: string; color?: string }) => {
      const { data } = await apiClient.post('/boards', payload)
      return data.data as Board
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['boards', v.projectId] })
      toast.success('Board created')
    },
    onError: () => toast.error('Failed to create board'),
  })
}

export function useTasks(boardId: string) {
  return useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks?boardId=${boardId}`)
      return data.data as Task[]
    },
    enabled: !!boardId,
  })
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/${taskId}`)
      return data.data as Task
    },
    enabled: !!taskId,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTaskForm) => {
      const { data } = await apiClient.post('/tasks', payload)
      return data.data as Task
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks', task.boardId] })
      toast.success('Task created')
    },
    onError: () => toast.error('Failed to create task'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    // _previousBoardId is stripped here — not sent to API
    mutationFn: async ({
      id,
      _previousBoardId,
      ...payload
    }: Partial<Task> & { id: string; _previousBoardId?: string }) => {
      const { data } = await apiClient.patch(`/tasks/${id}`, payload)
      return data.data as Task
    },
    onSuccess: (updatedTask, variables) => {
      // Always invalidate the updated task's current board
      qc.invalidateQueries({ queryKey: ['tasks', updatedTask.boardId] })
      qc.invalidateQueries({ queryKey: ['task', updatedTask.id] })

      // CRITICAL: also invalidate the OLD board so it stops showing the task
      if (
        variables._previousBoardId &&
        variables._previousBoardId !== updatedTask.boardId
      ) {
        qc.invalidateQueries({ queryKey: ['tasks', variables._previousBoardId] })
      }
    },
    onError: () => toast.error('Failed to update task'),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      await apiClient.delete(`/tasks/${id}`)
      return boardId
    },
    onSuccess: (boardId) => {
      qc.invalidateQueries({ queryKey: ['tasks', boardId] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })
}

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/comments?taskId=${taskId}`)
      return data.data as Comment[]
    },
    enabled: !!taskId,
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data } = await apiClient.post('/comments', { taskId, content })
      return data.data as Comment
    },
    onSuccess: (c) => qc.invalidateQueries({ queryKey: ['comments', c.taskId] }),
    onError: () => toast.error('Failed to add comment'),
  })
}

export function useTaskActivity(taskId: string) {
  return useQuery({
    queryKey: ['activity', taskId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/${taskId}/activity`)
      return data.data as ActivityLog[]
    },
    enabled: !!taskId,
  })
}
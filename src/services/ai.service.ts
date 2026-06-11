import apiClient from './apiClient'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function useAITaskBreakdown() {
  return useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      const { data } = await apiClient.post('/ai/breakdown', { title, description })
      return data.data
    },
    onError: () => toast.error('AI breakdown failed'),
  })
}

export function useParseNaturalTask() {
  return useMutation({
    mutationFn: async (input: string) => {
      const { data } = await apiClient.post('/ai/parse-task', { input })
      return data.data
    },
    onError: () => toast.error('Could not parse task'),
  })
}

export function useAIPrioritySuggest() {
  return useMutation({
    mutationFn: async (context: {
      taskTitle: string; dueDate?: string
      assigneeWorkload: number; dependencyCount: number; projectDeadline?: string
    }) => {
      const { data } = await apiClient.post('/ai/priority', context)
      return data.data
    },
  })
}

export function useGenerateStandup() {
  return useMutation({
    mutationFn: async (entries: object[]) => {
      const { data } = await apiClient.post('/ai/standup', { entries })
      return data.data.report as string
    },
    onSuccess: () => toast.success('Standup generated!'),
    onError: () => toast.error('Failed to generate standup'),
  })
}

export function useGenerateSprintSummary() {
  return useMutation({
    mutationFn: async (sprintData: object) => {
      const { data } = await apiClient.post('/ai/sprint-summary', sprintData)
      return data.data.summary as string
    },
    onSuccess: () => toast.success('Sprint summary generated!'),
  })
}

export function useAnalyzeComments() {
  return useMutation({
    mutationFn: async (comments: object[]) => {
      const { data } = await apiClient.post('/ai/analyze-comments', { comments })
      return data.data
    },
  })
}

export function useAnalyticsInsight() {
  return useMutation({
    mutationFn: async (metrics: object) => {
      const { data } = await apiClient.post('/ai/analytics-insight', metrics)
      return data.data.insight as string
    },
  })
}
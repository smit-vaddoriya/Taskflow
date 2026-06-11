import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../store/authStore'
import type { OrganizationMember, Project, CreateProjectForm, OrgWithRole } from '../types'

export function useOrgMembers() {
  const { currentOrg } = useAuthStore()
  return useQuery({
    queryKey: ['members', currentOrg?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/orgs/members')
      return data.data as OrganizationMember[]
    },
    enabled: !!currentOrg,
  })
}

export function useProjects() {
  const { currentOrg } = useAuthStore()
  return useQuery({
    queryKey: ['projects', currentOrg?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects')
      return data.data as Project[]
    },
    enabled: !!currentOrg,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  const { currentOrg } = useAuthStore()
  return useMutation({
    mutationFn: async (payload: CreateProjectForm) => {
      const { data } = await apiClient.post('/projects', payload)
      return data.data as Project
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', currentOrg?.id] })
      toast.success('Project created')
    },
    onError: () => toast.error('Failed to create project'),
  })
}

// Pending invites — list all active invites with their URLs
export function usePendingInvites() {
  const { currentOrg } = useAuthStore()
  return useQuery({
    queryKey: ['invites', currentOrg?.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/orgs/invites')
      return data.data as {
        id: string; email: string; role: string
        token: string; inviteUrl: string
        expiresAt: string; createdAt: string
      }[]
    },
    enabled: !!currentOrg,
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  const { currentOrg } = useAuthStore()
  return useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      const { data } = await apiClient.post('/orgs/invite', payload)
      // Returns { id, email, role, token, inviteUrl, expiresAt }
      return data.data as {
        id: string; email: string; role: string
        token: string; inviteUrl: string; expiresAt: string
      }
    },
    onSuccess: () => {
      // Refresh pending invites list
      qc.invalidateQueries({ queryKey: ['invites', currentOrg?.id] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create invite'),
  })
}

export function useAcceptInvite() {
  const qc = useQueryClient()
  const { setOrganizations, setCurrentOrg, organizations } = useAuthStore()
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post(`/orgs/invite/${token}/accept`)
      return data
    },
    onSuccess: async () => {
      try {
        const { data } = await apiClient.get('/orgs')
        const orgs = data.data as OrgWithRole[]
        setOrganizations(orgs)
        const newOrg = orgs.find(o => !organizations.some(e => e.id === o.id))
        if (newOrg) setCurrentOrg(newOrg)
      } catch {}
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('You joined the workspace! 🎉')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to accept invite'),
  })
}
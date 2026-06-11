import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../store/authStore'
import type { LoginForm, RegisterForm, OrgWithRole } from '../types'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const login = useMutation({
    mutationFn: async (form: LoginForm) => {
      const { data } = await apiClient.post('/auth/login', form)
      return data.data
    },
    onSuccess: (d) => {
      store.setAuth(d.user, d.token, d.refreshToken)
      store.setOrganizations(d.organizations)
      if (d.organizations.length > 0) { store.setCurrentOrg(d.organizations[0]); navigate('/dashboard') }
      else navigate('/setup')
      toast.success(`Welcome back, ${d.user.name}!`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Login failed'),
  })

  const register = useMutation({
    mutationFn: async (form: RegisterForm) => {
      const { data } = await apiClient.post('/auth/register', form)
      return data.data
    },
    onSuccess: (d) => {
      store.setAuth(d.user, d.token, d.refreshToken)
      navigate('/setup')
      toast.success('Account created!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Registration failed'),
  })

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    store.logout()
    qc.clear()
    navigate('/login')
    toast.success('Logged out')
  }

  return { login, register, logout, user: store.user, token: store.token }
}

export function useCreateOrg() {
  const store = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; slug: string }) => {
      const { data } = await apiClient.post('/orgs', payload)
      return data.data
    },
    onSuccess: (org: OrgWithRole) => {
      store.setCurrentOrg(org)
      store.setOrganizations([...store.organizations, org])
      qc.invalidateQueries({ queryKey: ['organizations'] })
      navigate('/dashboard')
      toast.success(`Workspace "${org.name}" created!`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create workspace'),
  })
}
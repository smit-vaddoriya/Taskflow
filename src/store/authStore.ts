import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, OrgWithRole } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  currentOrg: OrgWithRole | null
  organizations: OrgWithRole[]
  setAuth: (user: User, token: string, refreshToken: string) => void
  setCurrentOrg: (org: OrgWithRole) => void
  setOrganizations: (orgs: OrgWithRole[]) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null, refreshToken: null,
      currentOrg: null, organizations: [],
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      setCurrentOrg: (org) => set({ currentOrg: org }),
      setOrganizations: (organizations) => set({ organizations }),
      updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
      logout: () => set({ user: null, token: null, refreshToken: null, currentOrg: null, organizations: [] }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user, token: s.token, refreshToken: s.refreshToken,
        currentOrg: s.currentOrg, organizations: s.organizations,
      }),
    }
  )
)
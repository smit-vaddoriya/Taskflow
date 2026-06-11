import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

const RANK: Record<Role, number> = {
  OWNER: 5, ADMIN: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1,
}

export interface Permissions {
  role: Role
  rank: number
  isOwner:   boolean
  isAdmin:   boolean
  isManager: boolean
  isMember:  boolean
  isViewer:  boolean
  can: {
    // Projects
    createProject:    boolean
    editProject:      boolean
    deleteProject:    boolean
    archiveProject:   boolean
    // Boards
    createBoard:      boolean
    editBoard:        boolean
    deleteBoard:      boolean
    // Tasks
    createTask:       boolean
    editTask:         boolean
    deleteTask:       boolean
    dragTask:         boolean
    assignTask:       boolean
    // Members & workspace
    inviteMembers:    boolean
    removeMembers:    boolean
    changeRoles:      boolean
    editWorkspace:    boolean
    deleteWorkspace:  boolean
    // Features
    viewAnalytics:    boolean
    manageSettings:   boolean
    useAI:            boolean
  }
}

export function usePermissions(): Permissions {
  const { currentOrg } = useAuthStore()
  const role = (currentOrg?.role ?? 'VIEWER') as Role
  const rank = RANK[role] ?? 1

  const atLeast = (r: Role) => rank >= RANK[r]

  return {
    role,
    rank,
    isOwner:   role === 'OWNER',
    isAdmin:   atLeast('ADMIN'),
    isManager: atLeast('MANAGER'),
    isMember:  atLeast('MEMBER'),
    isViewer:  atLeast('VIEWER'),
    can: {
      // Projects
      createProject:    atLeast('MANAGER'),
      editProject:      atLeast('MANAGER'),
      deleteProject:    atLeast('ADMIN'),
      archiveProject:   atLeast('ADMIN'),
      // Boards
      createBoard:      atLeast('MANAGER'),
      editBoard:        atLeast('MANAGER'),
      deleteBoard:      atLeast('ADMIN'),
      // Tasks
      createTask:       atLeast('MEMBER'),
      editTask:         atLeast('MEMBER'),
      deleteTask:       atLeast('MANAGER'),
      dragTask:         atLeast('MEMBER'),
      assignTask:       atLeast('MEMBER'),
      // Members & workspace
      inviteMembers:    atLeast('ADMIN'),
      removeMembers:    atLeast('ADMIN'),
      changeRoles:      role === 'OWNER',
      editWorkspace:    atLeast('ADMIN'),
      deleteWorkspace:  role === 'OWNER',
      // Features
      viewAnalytics:    atLeast('MANAGER'),
      manageSettings:   atLeast('ADMIN'),
      useAI:            atLeast('MEMBER'),
    },
  }
}
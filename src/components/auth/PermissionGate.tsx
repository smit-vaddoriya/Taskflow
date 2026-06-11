import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import type { Permissions } from '../../hooks/usePermissions'

interface Props {
  // Pass a function that receives permissions and returns boolean
  check: (p: Permissions) => boolean
  // What to render when denied (optional)
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Conditionally render children based on user permissions.
 *
 * Usage:
 *   <PermissionGate check={p => p.can.createTask}>
 *     <button>New Task</button>
 *   </PermissionGate>
 *
 *   <PermissionGate check={p => p.isAdmin} fallback={<ReadOnlyView />}>
 *     <EditableView />
 *   </PermissionGate>
 */
export default function PermissionGate({ check, fallback = null, children }: Props) {
  const permissions = usePermissions()
  if (!check(permissions)) return <>{fallback}</>
  return <>{children}</>
}
import React from 'react'
import { ShieldOff } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import RoleBadge from '../ui/RoleBadge'
import { C, R } from '../../design/tokens'

interface Props {
  message?: string
  requiredRole?: string
}

export default function AccessDenied({ message, requiredRole }: Props) {
  const { role } = usePermissions()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px', textAlign: 'center', gap: '16px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: R.xl, background: `${C.red}10`, border: `1px solid ${C.red}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldOff size={22} color={C.red} />
      </div>
      <div>
        <p style={{ fontSize: '16px', fontWeight: 700, color: C.t1, marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Access restricted
        </p>
        <p style={{ fontSize: '13px', color: C.t4, maxWidth: '280px', lineHeight: 1.6 }}>
          {message ?? "You don't have permission to view this page."}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.t4 }}>
        <span>Your role:</span>
        <RoleBadge role={role} />
        {requiredRole && <><span>Required:</span><span style={{ fontSize: '10px', fontWeight: 700, color: C.t3 }}>{requiredRole}+</span></>}
      </div>
    </div>
  )
}
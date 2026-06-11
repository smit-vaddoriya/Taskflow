import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, X, BellOff, Check, UserPlus, Loader2 } from 'lucide-react'
import apiClient from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { C, R } from '../../design/tokens'
import toast from 'react-hot-toast'
import type { Notification, OrgWithRole } from '../../types'

const TYPE_ICONS: Record<string, string> = {
  TASK_ASSIGNED:  '📋',
  TASK_COMMENT:   '💬',
  TASK_DUE_SOON:  '⏰',
  TASK_OVERDUE:   '🔴',
  MENTION:        '📣',
  INVITE:         '🎉',
  SPRINT_SUMMARY: '📊',
}

export default function NotificationCenter({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { setOrganizations, setCurrentOrg, organizations } = useAuthStore()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [decliningId, setDecliningId] = useState<string | null>(null)

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications')
      return data.data as Notification[]
    },
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const handleAccept = async (notification: Notification) => {
    if (!notification.link) {
      toast.error('Invite link missing')
      return
    }

    setAcceptingId(notification.id)
    try {
      // Accept the invite
      await apiClient.post(`/orgs/invite/${notification.link}/accept`)

      // Refresh org list and switch to new org
      const { data } = await apiClient.get('/orgs')
      const orgs = data.data as OrgWithRole[]
      setOrganizations(orgs)

      // Find the newly joined org
      const newOrg = orgs.find(o => !organizations.some(e => e.id === o.id))
      if (newOrg) setCurrentOrg(newOrg)

      // Mark notification as read
      await apiClient.patch(`/notifications/${notification.id}/read`)
      qc.invalidateQueries({ queryKey: ['notifications'] })

      toast.success(`Joined workspace! 🎉`)
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to accept invite')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleDecline = async (notification: Notification) => {
    setDecliningId(notification.id)
    try {
      await apiClient.patch(`/notifications/${notification.id}/read`)
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast('Invite declined', { icon: '👋' })
    } catch {}
    finally { setDecliningId(null) }
  }

  const unread       = notifications.filter(n => !n.isRead).length
  const inviteNotifs = notifications.filter(n => n.type === 'INVITE' && !n.isRead)
  const otherNotifs  = notifications.filter(n => !(n.type === 'INVITE' && !n.isRead))

  return (
    <div style={{
      width: '380px',
      background: C.bg2,
      border: `1px solid ${C.b2}`,
      borderRadius: R['2xl'],
      overflow: 'hidden',
      boxShadow: C.shadowModal,
      animation: 'slideDown 0.18s cubic-bezier(0.22,1,0.36,1)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${C.b1}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={14} color={C.t3} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: C.t1 }}>Notifications</span>
          {unread > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, background: C.a1, color: 'white', padding: '1px 6px', borderRadius: R.full }}>
              {unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              title="Mark all read"
              style={{ width: '28px', height: '28px', borderRadius: R.md, background: 'transparent', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.t2 }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}
            >
              <CheckCheck size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: R.md, background: 'transparent', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.t2 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t4 }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: '460px', overflowY: 'auto' }}>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: C.t4, fontSize: '13px' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Loading...
          </div>
        )}

        {/* Empty */}
        {!isLoading && notifications.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: C.bg3, borderRadius: R.xl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BellOff size={18} color={C.t4} />
            </div>
            <p style={{ fontSize: '13px', color: C.t4 }}>No notifications</p>
          </div>
        )}

        {/* ── Invite notifications — top, prominent ── */}
        {inviteNotifs.length > 0 && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 16px 6px' }}>
              Invitations
            </p>
            {inviteNotifs.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '14px 16px',
                  background: `${C.a1}08`,
                  borderBottom: `1px solid ${C.b1}`,
                  borderLeft: `3px solid ${C.a1}`,
                }}
              >
                {/* Invite info */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${C.a1}20`, border: `1px solid ${C.ab}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserPlus size={16} color={C.a2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: C.t1, lineHeight: 1.4, marginBottom: '3px' }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: '12px', color: C.t3, lineHeight: 1.4 }}>{n.body}</p>
                    <p style={{ fontSize: '11px', color: C.t4, marginTop: '4px' }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAccept(n)}
                    disabled={acceptingId === n.id}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 12px', borderRadius: R.lg,
                      background: acceptingId === n.id
                        ? `${C.green}18`
                        : `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
                      border: `1px solid ${acceptingId === n.id ? `${C.green}40` : C.ab}`,
                      color: acceptingId === n.id ? C.green : 'white',
                      fontSize: '12px', fontWeight: 700,
                      cursor: acceptingId === n.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: acceptingId === n.id ? 'none' : `0 2px 8px ${C.am}`,
                    }}
                    onMouseEnter={e => { if (acceptingId !== n.id) e.currentTarget.style.filter = 'brightness(1.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                  >
                    {acceptingId === n.id
                      ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Joining...</>
                      : <><Check size={12} /> Accept & Join</>
                    }
                  </button>

                  <button
                    onClick={() => handleDecline(n)}
                    disabled={decliningId === n.id}
                    style={{
                      padding: '8px 16px', borderRadius: R.lg,
                      background: 'transparent',
                      border: `1px solid ${C.b2}`,
                      color: C.t3, fontSize: '12px', fontWeight: 600,
                      cursor: decliningId === n.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                      opacity: decliningId === n.id ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.t1 }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3 }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Other notifications ── */}
        {otherNotifs.length > 0 && (
          <>
            {inviteNotifs.length > 0 && (
              <p style={{ fontSize: '10px', fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 16px 6px' }}>
                Recent
              </p>
            )}
            {otherNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.b1}`,
                  background: n.isRead ? 'transparent' : `${C.a1}05`,
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!n.isRead) (e.currentTarget as HTMLElement).style.background = `${C.a1}0a` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : `${C.a1}05` }}
              >
                <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: n.isRead ? C.t3 : C.t1, fontWeight: n.isRead ? 400 : 500, lineHeight: 1.45, marginBottom: '2px' }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: '11px', color: C.t4, lineHeight: 1.4 }}>{n.body}</p>
                  <p style={{ fontSize: '10px', color: C.t4, marginTop: '3px', opacity: 0.7 }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.a2, flexShrink: 0, marginTop: '5px', boxShadow: `0 0 6px ${C.a2}` }} />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.b1}`, textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: C.t4 }}>
            {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up ✓'}
          </p>
        </div>
      )}
    </div>
  )
}
import React, { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown, Zap, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Avatar from '../ui/Avatar'
import NotificationCenter from '../notifications/NotificationCenter'
import AIAssistant from '../ai/NLTaskInput'
import { useAuthStore } from '../../store/authStore'
import { C, R } from '../../design/tokens'
import apiClient from '../../services/apiClient'
import type { Notification } from '../../types'

interface Props {
  onOpenCmd: () => void
}

export default function Navbar({ onOpenCmd }: Props) {
  const { user }          = useAuthStore()
  const [showNotif, setShowNotif] = useState(false)
  const [showAI, setShowAI]       = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const navigate  = useNavigate()
  const notifRef  = useRef<HTMLDivElement>(null)

  // Close notification panel when clicking outside
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Real notification count — polls every 15s as WebSocket fallback
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications')
      return data.data as Notification[]
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const hasInvite   = notifications.some(n => n.type === 'INVITE' && !n.isRead)

  return (
    <>
      <header style={{
        height: '48px',
        flexShrink: 0,
        background: `${C.bg1}f0`,
        borderBottom: `1px solid ${C.b1}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
        backdropFilter: 'blur(20px) saturate(180%)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>

        {/* Search / Command trigger */}
        <div style={{ flex: 1, maxWidth: '280px' }}>
          <button
            onClick={onOpenCmd}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: R.lg,
              background: searchFocused ? C.bg2 : C.bg0,
              border: `1px solid ${searchFocused ? C.b2 : C.b1}`,
              cursor: 'text', transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => { setSearchFocused(true) }}
            onMouseLeave={e => { setSearchFocused(false) }}
          >
            <Search size={13} color={C.t4} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: C.t4, flex: 1 }}>Search...</span>
            <kbd style={{
              fontSize: '10px', color: C.t4, background: C.bg2,
              padding: '2px 5px', borderRadius: '5px',
              border: `1px solid ${C.b2}`, fontFamily: 'inherit',
              letterSpacing: '0.02em', flexShrink: 0,
            }}>⌘K</kbd>
          </button>
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>

          {/* Ask AI */}
          <button
            onClick={() => setShowAI(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: R.lg,
              background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
              border: `1px solid ${C.ab}`,
              cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white',
              boxShadow: `0 1px 2px rgba(0,0,0,0.3), 0 0 16px ${C.am}`,
              transition: 'all 0.15s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.filter = 'brightness(1.12)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = `0 4px 20px ${C.am}`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'none'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = `0 1px 2px rgba(0,0,0,0.3), 0 0 16px ${C.am}`
            }}
          >
            <Zap size={12} color="white" fill="white" strokeWidth={0} />
            Ask AI
          </button>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              style={{
                position: 'relative',
                width: '34px', height: '34px', borderRadius: R.lg,
                background: showNotif ? C.bg2 : 'transparent',
                border: `1px solid ${showNotif ? C.b2 : 'transparent'}`,
                cursor: 'pointer', color: C.t3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.bg2
                e.currentTarget.style.borderColor = C.b1
                e.currentTarget.style.color = C.t2
              }}
              onMouseLeave={e => {
                if (!showNotif) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.color = C.t3
                }
              }}
            >
              <Bell size={15} />

              {/* Badge — real unread count */}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: hasInvite ? '5px' : '6px',
                  right: hasInvite ? '5px' : '6px',
                  minWidth: '14px', height: '14px',
                  padding: '0 3px',
                  background: hasInvite ? C.a1 : C.red,
                  borderRadius: R.full,
                  border: `1.5px solid ${C.bg1}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px', fontWeight: 800, color: 'white',
                  lineHeight: 1,
                  boxShadow: hasInvite
                    ? `0 0 8px ${C.a1}90`
                    : `0 0 6px ${C.red}80`,
                  // Pulse animation when there's an invite
                  animation: hasInvite ? 'glow 1.5s ease-in-out infinite' : 'none',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute', right: 0,
                top: 'calc(100% + 8px)', zIndex: 50,
              }}>
                <NotificationCenter onClose={() => setShowNotif(false)} />
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: C.b1, margin: '0 4px' }} />

          {/* Profile */}
          <button
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '5px 10px 5px 6px', borderRadius: R.lg,
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.bg2
              e.currentTarget.style.borderColor = C.b1
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size="sm" />
            <span style={{
              fontSize: '12px', fontWeight: 600, color: C.t2,
              maxWidth: '80px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={11} color={C.t4} />
          </button>
        </div>
      </header>

      {/* AI panel — modal overlay */}
      {showAI && (
        <AIAssistant onClose={() => setShowAI(false)} floating={false} />
      )}
    </>
  )
}
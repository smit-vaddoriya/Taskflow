import React, { useState } from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import {
  User, Building2, Users, Shield, Camera,
  Save, Loader2, Check, Mail, Lock, Eye, EyeOff,
  UserPlus, ChevronDown, AlertTriangle, Trash2, Copy,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useOrgMembers, useInviteMember, usePendingInvites } from '../../hooks/useOrg'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../../components/ui/Avatar'
import RoleBadge from '../../components/ui/RoleBadge'
import Modal from '../../components/ui/Modal'
import apiClient from '../../services/apiClient'
import { C, R } from '../../design/tokens'
import type { Role } from '../../types'

// ─────────────────────────────────────────────────────────────
// ALL shared primitives at MODULE LEVEL
// Never define components inside other components —
// React will remount them on every render causing focus loss
// ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 600, color: C.t4,
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px',
    }}>
      {children}
    </p>
  )
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

function FieldInput({ disabled, error, style, onFocus, onBlur, ...props }: FieldInputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      disabled={disabled}
      onFocus={e => { setFocused(true); onFocus?.(e) }}
      onBlur={e => { setFocused(false); onBlur?.(e) }}
      style={{
        width: '100%', outline: 'none', transition: 'all 0.15s',
        background: disabled ? C.bg0 : focused ? C.bg2 : C.bg1,
        border: `1px solid ${error ? C.red : focused ? C.a1 : C.b2}`,
        borderRadius: R.lg, padding: '9px 13px',
        fontSize: '13px', color: disabled ? C.t4 : C.t1,
        boxShadow: focused ? `0 0 0 3px ${error ? C.redM : C.am}` : 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        ...style,
      }}
    />
  )
}

// CRITICAL: PasswordField at module level
interface PasswordFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  show: boolean
  onToggle: () => void
  error?: boolean
}

function PasswordField({ label, value, onChange, placeholder, show, onToggle, error }: PasswordFieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ position: 'relative' }}>
        <Lock
          size={13}
          color={focused ? C.a2 : C.t4}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.15s' }}
        />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', outline: 'none', transition: 'all 0.15s',
            background: focused ? C.bg2 : C.bg1,
            border: `1px solid ${error ? C.red : focused ? C.a1 : C.b2}`,
            borderRadius: R.lg, padding: '9px 40px 9px 34px',
            fontSize: '13px', color: C.t1,
            boxShadow: focused ? `0 0 0 3px ${error ? C.redM : C.am}` : 'none',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.t4, display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.t2}
          onMouseLeave={e => e.currentTarget.style.color = C.t4}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', marginBottom: subtitle ? '3px' : 0 }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: '12px', color: C.t4 }}>{subtitle}</p>}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl, padding: '20px', ...style }}>
      {children}
    </div>
  )
}

function SaveButton({ loading, saved, disabled, onClick }: {
  loading: boolean; saved: boolean; disabled?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '8px 16px', borderRadius: R.lg,
        background: saved ? `${C.green}20` : disabled ? C.bg3 : `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
        border: `1px solid ${saved ? `${C.green}40` : disabled ? C.b2 : C.ab}`,
        color: saved ? C.green : disabled ? C.t4 : 'white',
        fontSize: '13px', fontWeight: 600,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: saved || disabled ? 'none' : `0 2px 8px ${C.am}`,
      }}
      onMouseEnter={e => { if (!loading && !disabled && !saved) e.currentTarget.style.filter = 'brightness(1.1)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        : saved ? <Check size={14} />
        : <Save size={14} />}
      {loading ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Profile tab
// ─────────────────────────────────────────────────────────────
function ProfileSettings() {
  const { user, updateUser } = useAuthStore()
  const [name, setName]     = useState(user?.name ?? '')
  const [saved, setSaved]   = useState(false)
  const isDirty             = name.trim() !== (user?.name ?? '') && name.trim().length >= 2

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch('/auth/me', { name: name.trim() })
      return data.data
    },
    onSuccess: updated => {
      updateUser(updated)
      setSaved(true)
      toast.success('Profile updated')
      setTimeout(() => setSaved(false), 2000)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update profile'),
  })

  return (
    <div>
      <SectionHeader title="Profile" subtitle="Manage your personal information" />
      <Card>
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', marginBottom: '20px', borderBottom: `1px solid ${C.b1}` }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size="xl" />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: C.a1, border: `2px solid ${C.bg1}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={11} color="white" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>{user?.name}</p>
            <p style={{ fontSize: '12px', color: C.t4, marginTop: '2px' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: R.full, background: `${C.green}15`, color: C.green, border: `1px solid ${C.green}30` }}>
                Active
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: R.full, background: C.am, color: C.a2, border: `1px solid ${C.ab}` }}>
                {user?.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <FieldLabel>Full name</FieldLabel>
            <FieldInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="off"
            />
            {name.trim().length > 0 && name.trim().length < 2 && (
              <p style={{ fontSize: '11px', color: C.red, marginTop: '5px' }}>Name must be at least 2 characters</p>
            )}
          </div>
          <div>
            <FieldLabel>Email address</FieldLabel>
            <div style={{ position: 'relative' }}>
              <Mail size={13} color={C.t4} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <FieldInput value={user?.email ?? ''} disabled style={{ paddingLeft: '34px' }} />
            </div>
            <p style={{ fontSize: '10px', color: C.t4, marginTop: '5px' }}>Email cannot be changed</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton
            loading={save.isPending}
            saved={saved}
            disabled={!isDirty}
            onClick={() => { if (isDirty && !save.isPending) save.mutate() }}
          />
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Workspace tab
// ─────────────────────────────────────────────────────────────
function WorkspaceSettings() {
  const { currentOrg } = useAuthStore()
  const [orgName, setOrgName] = useState(currentOrg?.name ?? '')
  const [saved, setSaved]     = useState(false)
  const isDirty               = orgName.trim() !== (currentOrg?.name ?? '') && orgName.trim().length >= 2

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/orgs/${currentOrg?.id}`, { name: orgName.trim() })
      return data.data
    },
    onSuccess: () => {
      setSaved(true)
      toast.success('Workspace updated')
      setTimeout(() => setSaved(false), 2000)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update workspace'),
  })

  return (
    <div>
      <SectionHeader title="Workspace" subtitle="Manage your organization settings" />
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <FieldLabel>Workspace name</FieldLabel>
          <FieldInput value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Workspace name" />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <FieldLabel>Plan</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 13px', background: C.bg0, border: `1px solid ${C.b1}`, borderRadius: R.lg }}>
            <span style={{ fontSize: '13px', color: C.t2, textTransform: 'capitalize', fontWeight: 500 }}>
              {currentOrg?.plan ?? 'free'} plan
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: C.a2, background: C.am, padding: '2px 8px', borderRadius: R.full, border: `1px solid ${C.ab}`, fontWeight: 600 }}>
              Upgrade
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton
            loading={save.isPending}
            saved={saved}
            disabled={!isDirty}
            onClick={() => { if (isDirty && !save.isPending) save.mutate() }}
          />
        </div>
      </Card>

      {/* Danger zone */}
      <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: R.xl, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <AlertTriangle size={14} color={C.red} />
          <p style={{ fontSize: '13px', fontWeight: 700, color: C.red }}>Danger Zone</p>
        </div>
        <p style={{ fontSize: '12px', color: C.t4, marginBottom: '14px' }}>
          Permanently deletes the workspace and all its data. This cannot be undone.
        </p>
        <button
          style={{ padding: '7px 14px', borderRadius: R.lg, background: 'transparent', border: `1px solid ${C.red}40`, color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = `${C.red}12`}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Delete workspace
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Members tab
// ─────────────────────────────────────────────────────────────
function MembersSettings() {
  const qc = useQueryClient()
  const { currentOrg } = useAuthStore()
  const { data: members = [], isLoading }  = useOrgMembers()
  const { data: pendingInvites = [] }      = usePendingInvites()
  const invite = useInviteMember()

  const [showModal, setShowModal]     = useState(false)
  const [email, setEmail]             = useState('')
  const [role, setRole]               = useState('MEMBER')
  const [roleFocused, setRoleFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [inviteLink, setInviteLink]   = useState<string | null>(null)
  const [copiedId, setCopiedId]       = useState<string | null>(null)
  const [revokingId, setRevokingId]   = useState<string | null>(null)

  const roleColors: Record<string, string> = {
    OWNER: C.yellow, ADMIN: C.purple, MANAGER: C.blue, MEMBER: C.green, VIEWER: C.t4,
  }

  const roleDescriptions: Record<string, string> = {
    VIEWER:  'Can view tasks and projects only',
    MEMBER:  'Can create and edit tasks, add comments',
    MANAGER: 'Can manage projects, boards, and sprints',
    ADMIN:   'Full access except workspace deletion',
  }

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Invite link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const revokeInvite = async (id: string) => {
    setRevokingId(id)
    try {
      await apiClient.delete(`/orgs/invites/${id}`)
      qc.invalidateQueries({ queryKey: ['invites', currentOrg?.id] })
      toast.success('Invite revoked')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to revoke invite')
    } finally {
      setRevokingId(null)
    }
  }

  const handleInvite = async () => {
    if (!email.trim()) return
    try {
      const result = await invite.mutateAsync({ email: email.trim(), role })
      setInviteLink(result.inviteUrl)
      setEmail('')
      setRole('MEMBER')
      toast.success(`Invite created for ${result.email}`)
    } catch {
      // error handled in mutation
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setInviteLink(null)
    setEmail('')
    setRole('MEMBER')
    setCopiedId(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', marginBottom: '3px' }}>
            Members
          </h2>
          <p style={{ fontSize: '12px', color: C.t4 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} pending invite${pendingInvites.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            borderRadius: R.lg, background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
            border: `1px solid ${C.ab}`, color: 'white',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            boxShadow: `0 2px 8px ${C.am}`, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
        >
          <UserPlus size={13} /> Invite member
        </button>
      </div>

      {/* ── Pending invites section ── */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Pending invites — share these links
          </p>
          <div style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl, overflow: 'hidden' }}>
            {pendingInvites.map((inv, i) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  borderBottom: i < pendingInvites.length - 1 ? `1px solid ${C.b1}` : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg2}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Invite info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.email}
                    </p>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: R.full, color: roleColors[inv.role] ?? C.t4, background: `${roleColors[inv.role] ?? C.t4}15`, border: `1px solid ${roleColors[inv.role] ?? C.t4}25`, flexShrink: 0 }}>
                      {inv.role}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: C.t4 }}>
                    Expires {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(inv.inviteUrl, inv.id)}
                    title="Copy invite link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', borderRadius: R.lg,
                      background: copiedId === inv.id ? `${C.green}15` : C.bg0,
                      border: `1px solid ${copiedId === inv.id ? `${C.green}40` : C.b2}`,
                      color: copiedId === inv.id ? C.green : C.t2,
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (copiedId !== inv.id) { e.currentTarget.style.background = C.bg2; e.currentTarget.style.borderColor = C.b3 } }}
                    onMouseLeave={e => { if (copiedId !== inv.id) { e.currentTarget.style.background = C.bg0; e.currentTarget.style.borderColor = C.b2 } }}
                  >
                    {copiedId === inv.id
                      ? <><Check size={11} /> Copied!</>
                      : <><Copy size={11} /> Copy link</>
                    }
                  </button>

                  {/* Revoke */}
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    disabled={revokingId === inv.id}
                    title="Revoke invite"
                    style={{ width: '30px', height: '30px', borderRadius: R.md, background: 'transparent', border: `1px solid ${C.b1}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t4, transition: 'all 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${C.red}10`; e.currentTarget.style.borderColor = `${C.red}30`; e.currentTarget.style.color = C.red }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.b1; e.currentTarget.style.color = C.t4 }}
                  >
                    {revokingId === inv.id
                      ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Trash2 size={12} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '10px 12px', background: C.am, border: `1px solid ${C.ab}`, borderRadius: R.lg }}>
            <span style={{ fontSize: '14px' }}>💡</span>
            <p style={{ fontSize: '11px', color: C.t3, lineHeight: 1.5 }}>
              Copy a link above and send it via WhatsApp, email, or Slack. The person opens it, logs in, and joins instantly.
            </p>
          </div>
        </div>
      )}

      {/* ── Members list ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading && (
          <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: C.t4, fontSize: '13px' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
          </div>
        )}
        {!isLoading && members.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Users size={28} color={C.t4} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: '13px', color: C.t4 }}>No members yet. Invite someone!</p>
          </div>
        )}
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 20px',
              borderBottom: i < members.length - 1 ? `1px solid ${C.b1}` : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg2}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <Avatar name={m.user.name} src={m.user.avatarUrl} size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.t1 }}>{m.user.name}</p>
              <p style={{ fontSize: '11px', color: C.t4, marginTop: '1px' }}>{(m.user as any).email ?? ''}</p>
            </div>
            <RoleBadge role={m.role as Role} />
          </div>
        ))}
      </Card>

      {/* ── Invite modal ── */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={inviteLink ? 'Invite link ready!' : 'Invite a member'}
        subtitle={inviteLink ? 'Copy and share this link with your teammate' : "They'll use the link to join your workspace"}
      >
        <div style={{ padding: '20px 24px 24px' }}>

          {/* Step 1: Email form */}
          {!inviteLink && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <FieldLabel>Email address</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={13}
                    color={emailFocused ? C.a2 : C.t4}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.15s' }}
                  />
                  <FieldInput
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    style={{ paddingLeft: '34px' }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvite() }}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Role</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    onFocus={() => setRoleFocused(true)}
                    onBlur={() => setRoleFocused(false)}
                    style={{
                      width: '100%', appearance: 'none', WebkitAppearance: 'none',
                      background: roleFocused ? C.bg2 : C.bg1,
                      border: `1px solid ${roleFocused ? C.a1 : C.b2}`,
                      borderRadius: R.lg, padding: '9px 36px 9px 13px',
                      fontSize: '13px', color: C.t1, outline: 'none', cursor: 'pointer',
                      boxShadow: roleFocused ? `0 0 0 3px ${C.am}` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN'].map(r => (
                      <option key={r} value={r} style={{ background: C.bg2 }}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} color={C.t4} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <p style={{ fontSize: '11px', color: C.t4, marginTop: '5px' }}>
                  {roleDescriptions[role]}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button
                  onClick={closeModal}
                  style={{ padding: '8px 16px', borderRadius: R.lg, background: 'transparent', border: `1px solid ${C.b2}`, color: C.t3, fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t1 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!email.trim() || invite.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                    borderRadius: R.lg,
                    background: email.trim() ? `linear-gradient(135deg, ${C.a1}, ${C.a3})` : C.bg3,
                    border: `1px solid ${email.trim() ? C.ab : C.b2}`,
                    color: email.trim() ? 'white' : C.t4,
                    fontSize: '13px', fontWeight: 600,
                    cursor: email.trim() && !invite.isPending ? 'pointer' : 'not-allowed',
                    opacity: invite.isPending ? 0.8 : 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (email.trim() && !invite.isPending) e.currentTarget.style.filter = 'brightness(1.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  {invite.isPending
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                    : <><UserPlus size={13} /> Create invite</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Show invite link — big and obvious */}
          {inviteLink && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Success banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: `${C.green}10`, border: `1px solid ${C.green}25`, borderRadius: R.xl }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${C.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={18} color={C.green} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: C.green }}>Invite created successfully!</p>
                  <p style={{ fontSize: '11px', color: C.t4, marginTop: '2px' }}>Share this link — it expires in 7 days.</p>
                </div>
              </div>

              {/* The link itself */}
              <div>
                <FieldLabel>Invite link — share this with your teammate</FieldLabel>
                <div style={{
                  background: C.bg0, border: `1px solid ${C.b2}`, borderRadius: R.lg,
                  padding: '12px 14px', marginBottom: '8px',
                  fontSize: '12px', color: C.t3, fontFamily: 'monospace',
                  lineHeight: 1.6, wordBreak: 'break-all',
                }}>
                  {inviteLink}
                </div>

                {/* Big copy button */}
                <button
                  onClick={() => copyLink(inviteLink, 'modal')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: R.lg,
                    background: copiedId === 'modal'
                      ? `${C.green}18`
                      : `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
                    border: `1px solid ${copiedId === 'modal' ? `${C.green}40` : C.ab}`,
                    color: copiedId === 'modal' ? C.green : 'white',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: copiedId === 'modal' ? 'none' : `0 2px 12px ${C.am}`,
                  }}
                  onMouseEnter={e => { if (copiedId !== 'modal') e.currentTarget.style.filter = 'brightness(1.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  {copiedId === 'modal'
                    ? <><Check size={16} /> Copied to clipboard!</>
                    : <><Copy size={16} /> Copy invite link</>
                  }
                </button>
              </div>

              {/* Instructions */}
              <div style={{ background: C.bg0, border: `1px solid ${C.b1}`, borderRadius: R.lg, padding: '12px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: C.t2, marginBottom: '6px' }}>How it works</p>
                <p style={{ fontSize: '11px', color: C.t4, lineHeight: 1.8 }}>
                  1. Copy the link above<br />
                  2. Share via WhatsApp, email, Slack, etc.<br />
                  3. They open the link → sign in or register → join automatically<br />
                  4. You'll see them appear in this members list
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setInviteLink(null)}
                  style={{ padding: '8px 16px', borderRadius: R.lg, background: 'transparent', border: `1px solid ${C.b2}`, color: C.t3, fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.t1 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t3 }}
                >
                  Invite another
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '8px 20px', borderRadius: R.lg,
                    background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
                    border: `1px solid ${C.ab}`, color: 'white',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: `0 2px 8px ${C.am}`, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Security tab
// ─────────────────────────────────────────────────────────────
function SecuritySettings() {
  const [current, setCurrent]         = useState('')
  const [newPass, setNewPass]         = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saved, setSaved]             = useState(false)

  const passwordsMatch = newPass.length > 0 && confirm.length > 0 && newPass === confirm
  const passwordValid  = newPass.length >= 8
  const canSave        = current.length > 0 && passwordValid && passwordsMatch
  const confirmError   = confirm.length > 0 && !passwordsMatch

  const changePassword = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch('/auth/me/password', {
        currentPassword: current,
        newPassword: newPass,
      })
      return data
    },
    onSuccess: () => {
      setSaved(true)
      setCurrent(''); setNewPass(''); setConfirm('')
      toast.success('Password changed successfully')
      setTimeout(() => setSaved(false), 2000)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to change password'),
  })

  return (
    <div>
      <SectionHeader title="Security" subtitle="Change your password and manage sessions" />
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <PasswordField
            label="Current password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter your current password"
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
          />
          <PasswordField
            label="New password"
            value={newPass}
            onChange={setNewPass}
            placeholder="Minimum 8 characters"
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
          />
          {newPass.length > 0 && newPass.length < 8 && (
            <p style={{ fontSize: '11px', color: C.yellow, marginTop: '-8px' }}>
              Password must be at least 8 characters
            </p>
          )}
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat new password"
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
            error={confirmError}
          />
          {confirmError && (
            <p style={{ fontSize: '11px', color: C.red, marginTop: '-8px' }}>Passwords do not match</p>
          )}
          {passwordsMatch && confirm.length > 0 && (
            <p style={{ fontSize: '11px', color: C.green, marginTop: '-8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={11} /> Passwords match
            </p>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton
            loading={changePassword.isPending}
            saved={saved}
            disabled={!canSave}
            onClick={() => { if (canSave && !changePassword.isPending) changePassword.mutate() }}
          />
        </div>
      </Card>

      {/* Active sessions */}
      <div style={{ marginTop: '16px', background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: R.xl, padding: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.t1, marginBottom: '4px' }}>Active sessions</h3>
        <p style={{ fontSize: '12px', color: C.t4, marginBottom: '14px' }}>Devices currently logged into your account</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: C.bg0, borderRadius: R.lg, border: `1px solid ${C.b1}` }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: C.t1 }}>Current session</p>
            <p style={{ fontSize: '11px', color: C.t4 }}>Web browser · Active now</p>
          </div>
          <span style={{ fontSize: '11px', color: C.green, background: `${C.green}15`, padding: '2px 8px', borderRadius: R.full, border: `1px solid ${C.green}30`, fontWeight: 600 }}>
            Active
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main settings shell
// ─────────────────────────────────────────────────────────────
const TABS = [
  { to: '/settings/profile',   Icon: User,      label: 'Profile'   },
  { to: '/settings/workspace', Icon: Building2, label: 'Workspace' },
  { to: '/settings/members',   Icon: Users,     label: 'Members'   },
  { to: '/settings/security',  Icon: Shield,    label: 'Security'  },
]

export default function SettingsPage() {
  const { logout } = useAuth()

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '9px',
    padding: '8px 11px', borderRadius: R.lg,
    fontSize: '13px', fontWeight: 500,
    color: isActive ? C.a2 : C.t3,
    background: isActive ? C.am : 'transparent',
    border: `1px solid ${isActive ? C.ab : 'transparent'}`,
    textDecoration: 'none', cursor: 'pointer', transition: 'all 0.12s',
  })

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', marginBottom: '28px' }}>
        Settings
      </h1>

      <div style={{ display: 'flex', gap: '28px' }}>
        {/* Sidebar */}
        <nav style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {TABS.map(({ to, Icon, label }) => (
            <NavLink
              key={to} to={to}
              style={({ isActive }) => tabStyle(isActive)}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.style.background.includes('124')) { el.style.background = C.bg2; el.style.color = C.t1 }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.style.background.includes('124')) { el.style.background = 'transparent'; el.style.color = C.t3 }
              }}
            >
              <Icon size={14} />{label}
            </NavLink>
          ))}

          <div style={{ height: '1px', background: C.b1, margin: '10px 0' }} />

          <button
            onClick={logout}
            style={{ ...tabStyle(false), color: C.red, width: '100%', background: 'transparent', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.red}10`; e.currentTarget.style.borderColor = `${C.red}25` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            Sign out
          </button>
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile"   element={<ProfileSettings />} />
            <Route path="workspace" element={<WorkspaceSettings />} />
            <Route path="members"   element={<MembersSettings />} />
            <Route path="security"  element={<SecuritySettings />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
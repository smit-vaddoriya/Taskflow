import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, ArrowRight, CheckSquare, Zap, Shield, Users,
  Link2, Check, Loader2, ArrowLeft,
} from 'lucide-react'
import { useCreateOrg } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/apiClient'
import toast from 'react-hot-toast'
import { C, R } from '../../design/tokens'
import type { OrgWithRole } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Workspace name required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
})
type F = z.infer<typeof schema>

type View = 'choose' | 'create' | 'join'

const perks = [
  { icon: Zap,    text: 'AI task breakdown & insights', color: C.a1 },
  { icon: Users,  text: 'Unlimited team members',        color: C.green },
  { icon: Shield, text: 'Role-based access control',     color: C.yellow },
]

// Extract token from a full invite URL or raw token
function extractToken(input: string): string {
  const trimmed = input.trim()
  // If it looks like a URL, grab the last path segment
  if (trimmed.includes('/invite/')) {
    const parts = trimmed.split('/invite/')
    return parts[parts.length - 1].trim()
  }
  return trimmed
}

// ─── Choose screen ────────────────────────────────────────────
function ChooseView({ onSelect }: { onSelect: (v: 'create' | 'join') => void }) {
  const [hovCreate, setHovCreate] = useState(false)
  const [hovJoin, setHovJoin]     = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Create */}
      <button
        onClick={() => onSelect('create')}
        onMouseEnter={() => setHovCreate(true)}
        onMouseLeave={() => setHovCreate(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '20px', borderRadius: R.xl, textAlign: 'left',
          background: hovCreate ? `${C.a1}10` : C.bg0,
          border: `1px solid ${hovCreate ? C.ab : C.b2}`,
          cursor: 'pointer', transition: 'all 0.15s', width: '100%',
          boxShadow: hovCreate ? `0 0 0 1px ${C.ab}` : 'none',
        }}
      >
        <div style={{
          width: '46px', height: '46px', borderRadius: R.xl, flexShrink: 0,
          background: hovCreate ? `${C.a1}20` : C.bg2,
          border: `1px solid ${hovCreate ? C.ab : C.b2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          <Building2 size={20} color={hovCreate ? C.a2 : C.t3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: hovCreate ? C.t1 : C.t2, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Create a workspace
          </p>
          <p style={{ fontSize: '12px', color: C.t4, lineHeight: 1.5 }}>
            Start fresh — set up your own workspace and invite your team
          </p>
        </div>
        <ArrowRight size={16} color={hovCreate ? C.a2 : C.t4} style={{ flexShrink: 0, transition: 'color 0.15s', transform: hovCreate ? 'translateX(2px)' : 'none' }} />
      </button>

      {/* Join */}
      <button
        onClick={() => onSelect('join')}
        onMouseEnter={() => setHovJoin(true)}
        onMouseLeave={() => setHovJoin(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '20px', borderRadius: R.xl, textAlign: 'left',
          background: hovJoin ? `${C.green}08` : C.bg0,
          border: `1px solid ${hovJoin ? `${C.green}40` : C.b2}`,
          cursor: 'pointer', transition: 'all 0.15s', width: '100%',
          boxShadow: hovJoin ? `0 0 0 1px ${C.green}30` : 'none',
        }}
      >
        <div style={{
          width: '46px', height: '46px', borderRadius: R.xl, flexShrink: 0,
          background: hovJoin ? `${C.green}15` : C.bg2,
          border: `1px solid ${hovJoin ? `${C.green}40` : C.b2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          <Link2 size={20} color={hovJoin ? C.green : C.t3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: hovJoin ? C.t1 : C.t2, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Join a workspace
          </p>
          <p style={{ fontSize: '12px', color: C.t4, lineHeight: 1.5 }}>
            Have an invite link? Paste it here and join your team instantly
          </p>
        </div>
        <ArrowRight size={16} color={hovJoin ? C.green : C.t4} style={{ flexShrink: 0, transition: 'color 0.15s', transform: hovJoin ? 'translateX(2px)' : 'none' }} />
      </button>
    </div>
  )
}

// ─── Join view ────────────────────────────────────────────────
function JoinView({ onBack }: { onBack: () => void }) {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState(false)
  const { setOrganizations, setCurrentOrg, organizations } = useAuthStore()
  const navigate = useNavigate()

  const handleJoin = async () => {
    const token = extractToken(input)
    if (!token) { toast.error('Please paste your invite link or token'); return }

    setLoading(true)
    try {
      // Accept the invite
      await apiClient.post(`/orgs/invite/${token}/accept`)

      // Re-fetch all orgs so new workspace appears
      const { data } = await apiClient.get('/orgs')
      const orgs = data.data as OrgWithRole[]
      setOrganizations(orgs)

      // Switch to the newly joined workspace
      const newOrg = orgs.find(o => !organizations.some(e => e.id === o.id))
      if (newOrg) {
        setCurrentOrg(newOrg)
        toast.success(`Joined "${newOrg.name}"! 🎉`)
      } else if (orgs.length > 0) {
        setCurrentOrg(orgs[orgs.length - 1])
        toast.success('Joined workspace! 🎉')
      }

      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Invalid or expired invite link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: C.t4, fontSize: '12px', fontWeight: 500, padding: '0', width: 'fit-content', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = C.t2}
        onMouseLeave={e => e.currentTarget.style.color = C.t4}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Info banner */}
      <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: `${C.green}08`, border: `1px solid ${C.green}20`, borderRadius: R.xl }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${C.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Link2 size={15} color={C.green} />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: C.green, marginBottom: '3px' }}>
            Join an existing workspace
          </p>
          <p style={{ fontSize: '12px', color: C.t4, lineHeight: 1.5 }}>
            Paste the full invite link you received, or just the token part after <code style={{ color: C.t3, fontSize: '11px' }}>/invite/</code>
          </p>
        </div>
      </div>

      {/* Input */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Invite link or token
        </p>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="http://localhost:3001/invite/abc123... or just the token"
          rows={3}
          style={{
            width: '100%', outline: 'none', resize: 'none',
            background: focused ? C.bg2 : C.bg0,
            border: `1px solid ${focused ? C.a1 : C.b2}`,
            borderRadius: R.lg, padding: '11px 14px',
            fontSize: '12px', color: C.t1, lineHeight: 1.6,
            fontFamily: 'monospace',
            boxShadow: focused ? `0 0 0 3px ${C.am}` : 'none',
            transition: 'all 0.2s',
          }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleJoin() }}
        />
        {input.trim() && (
          <p style={{ fontSize: '11px', color: C.t4, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, display: 'inline-block' }} />
            Token: <code style={{ color: C.t3, fontSize: '11px' }}>{extractToken(input) || '—'}</code>
          </p>
        )}
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={!input.trim() || loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '13px 20px', borderRadius: R.xl,
          background: input.trim() && !loading
            ? `linear-gradient(135deg, ${C.green}, #16a34a)`
            : C.bg2,
          border: `1px solid ${input.trim() ? `${C.green}50` : C.b2}`,
          color: input.trim() ? 'white' : C.t4,
          fontSize: '14px', fontWeight: 700,
          cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          boxShadow: input.trim() ? `0 4px 16px ${C.green}40` : 'none',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={e => { if (input.trim() && !loading) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
      >
        {loading
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Joining...</>
          : <><Check size={16} /> Join workspace</>
        }
      </button>

      <p style={{ fontSize: '11px', color: C.t4, textAlign: 'center' }}>
        <kbd style={{ fontSize: '10px', background: C.bg2, padding: '2px 5px', borderRadius: '4px', border: `1px solid ${C.b2}`, fontFamily: 'inherit', color: C.t3 }}>⌘ Enter</kbd>
        {' '}to join quickly
      </p>
    </div>
  )
}

// ─── Create view ──────────────────────────────────────────────
function CreateView({ onBack }: { onBack: () => void }) {
  const createOrg = useCreateOrg()
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<F>({ resolver: zodResolver(schema) })
  const name = watch('name', '')
  const [nameFocused, setNameFocused]   = useState(false)
  const [slugFocused, setSlugFocused]   = useState(false)

  useEffect(() => {
    setValue('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }, [name])

  return (
    <form onSubmit={handleSubmit(d => createOrg.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: C.t4, fontSize: '12px', fontWeight: 500, padding: '0', width: 'fit-content', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = C.t2}
        onMouseLeave={e => e.currentTarget.style.color = C.t4}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Workspace name */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Workspace name
        </p>
        <input
          {...register('name')}
          placeholder="Acme Inc."
          autoFocus
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          style={{
            width: '100%', outline: 'none', transition: 'all 0.2s',
            background: nameFocused ? C.bg2 : C.bg0,
            border: `1px solid ${errors.name ? C.red : nameFocused ? C.a1 : C.b2}`,
            borderRadius: R.lg, padding: '10px 14px',
            fontSize: '13px', color: C.t1,
            boxShadow: nameFocused ? `0 0 0 3px ${C.am}` : 'none',
          }}
        />
        {errors.name && <p style={{ fontSize: '11px', color: C.red, marginTop: '5px' }}>{errors.name.message}</p>}
      </div>

      {/* Slug */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          URL slug
        </p>
        <div style={{ display: 'flex', border: `1px solid ${slugFocused ? C.a1 : C.b2}`, borderRadius: R.lg, overflow: 'hidden', transition: 'all 0.2s', boxShadow: slugFocused ? `0 0 0 3px ${C.am}` : 'none' }}>
          <span style={{ background: C.bg2, padding: '10px 12px', fontSize: '12px', color: C.t4, borderRight: `1px solid ${C.b2}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
            taskflow.app/
          </span>
          <input
            {...register('slug')}
            placeholder="acme-inc"
            onFocus={() => setSlugFocused(true)}
            onBlur={() => setSlugFocused(false)}
            style={{ flex: 1, background: C.bg0, border: 'none', padding: '10px 14px', fontSize: '13px', color: C.t1, outline: 'none' }}
          />
        </div>
        {errors.slug && <p style={{ fontSize: '11px', color: C.red, marginTop: '5px' }}>{errors.slug.message}</p>}
      </div>

      {/* Perks */}
      <div style={{ background: C.am, border: `1px solid ${C.ab}`, borderRadius: R.xl, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {perks.map(({ icon: Icon, text, color }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: R.md, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={12} color={color} />
            </div>
            <span style={{ fontSize: '12px', color: C.t3 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={createOrg.isPending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '13px 20px', borderRadius: R.xl,
          background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
          border: `1px solid ${C.ab}`, color: 'white',
          fontSize: '14px', fontWeight: 700, cursor: createOrg.isPending ? 'not-allowed' : 'pointer',
          boxShadow: `0 4px 20px ${C.am}`, transition: 'all 0.2s',
          opacity: createOrg.isPending ? 0.8 : 1, letterSpacing: '-0.01em',
        }}
        onMouseEnter={e => { if (!createOrg.isPending) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
      >
        {createOrg.isPending
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
          : <>Create workspace <ArrowRight size={16} /></>
        }
      </button>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function OrgSetupPage() {
  const [view, setView] = useState<View>('choose')

  const titles: Record<View, { heading: string; sub: string }> = {
    choose: { heading: 'Get started',         sub: 'Create a new workspace or join an existing one'      },
    create: { heading: 'Create workspace',    sub: 'Set up your team\'s home in TaskFlow'                },
    join:   { heading: 'Join a workspace',    sub: 'Paste your invite link to join your team instantly'  },
  }

  const { heading, sub } = titles[view]

  return (
    <div style={{
      minHeight: '100vh', background: C.bg0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      backgroundImage: `radial-gradient(ellipse at 50% 0%, ${C.am} 0%, transparent 60%)`,
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${C.a1}, ${C.a3})`,
            borderRadius: R.xl, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${C.am}`,
          }}>
            <CheckSquare size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', marginBottom: '6px', transition: 'all 0.2s' }}>
            {heading}
          </h1>
          <p style={{ fontSize: '14px', color: C.t4, transition: 'all 0.2s' }}>{sub}</p>
        </div>

        {/* Card */}
        <div style={{
          background: C.bg1, border: `1px solid ${C.b1}`,
          borderRadius: R['2xl'], padding: '28px',
          boxShadow: C.shadowModal,
        }}>
          {view === 'choose' && <ChooseView onSelect={setView} />}
          {view === 'create' && <CreateView onBack={() => setView('choose')} />}
          {view === 'join'   && <JoinView   onBack={() => setView('choose')} />}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
          {(['choose', 'create', 'join'] as View[]).map(v => (
            <div key={v} style={{
              width: view === v ? '20px' : '6px',
              height: '6px', borderRadius: R.full,
              background: view === v ? C.a1 : C.b2,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
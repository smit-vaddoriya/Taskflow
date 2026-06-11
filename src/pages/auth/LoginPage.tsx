import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, ArrowRight, CheckSquare, Zap, Users, BarChart3 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  email: z.string().min(1, 'Email required').email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type F = z.infer<typeof schema>

const features = [
  { icon: CheckSquare, label: 'AI-powered task breakdown', color: '#6366f1' },
  { icon: Users,       label: 'Real-time team collaboration', color: '#22c55e' },
  { icon: BarChart3,   label: 'Smart analytics & insights', color: '#f59e0b' },
]

const Field = ({ label, icon: Icon, error, ...props }: any) => {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4d6080', marginBottom: '7px', letterSpacing: '0.02em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focused ? '#6366f1' : '#2a3f63', transition: 'color 0.15s', pointerEvents: 'none' }} />
        <input
          {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width: '100%', background: focused ? '#0f1f35' : '#0a1628',
            border: `1px solid ${error ? '#ef4444' : focused ? '#4f46e5' : '#1a2e4a'}`,
            borderRadius: '10px', padding: '10px 14px 10px 36px',
            fontSize: '13px', color: '#f1f5f9', outline: 'none',
            transition: 'all 0.2s',
            boxShadow: focused ? `0 0 0 3px rgba(99,102,241,0.12)` : 'none',
          }}
        />
      </div>
      {error && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) })

  return (
    <div style={{
      minHeight: '100vh', background: '#050c1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      backgroundImage: `
        radial-gradient(ellipse at 10% 10%, rgba(99,102,241,0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 90% 90%, rgba(99,102,241,0.04) 0%, transparent 50%)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(99,102,241,0.5)',
          }}>
            <CheckSquare size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: '#4d6080' }}>Sign in to continue to TaskFlow</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(180deg, #0e1c33 0%, #0a1628 100%)',
          border: '1px solid #1a2e4a', borderRadius: '20px', padding: '28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleSubmit(d => login.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Email address" icon={Mail} type="email" placeholder="you@company.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Field label="Password" icon={Lock} type="password" placeholder="••••••••" autoComplete="current-password" error={errors.password?.message} {...register('password')} />

            <button
              type="submit"
              disabled={login.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px 20px', borderRadius: '11px', marginTop: '4px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: '1px solid rgba(99,102,241,0.4)',
                color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(79,70,229,0.4)', transition: 'all 0.2s',
                opacity: login.isPending ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!login.isPending) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(79,70,229,0.5)' } }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.4)' }}
            >
              {login.isPending
                ? <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/><path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> Signing in...</>
                : <>Sign in <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #0f1e35', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#3d5068' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '12px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: '#4d6080' }}>
            Demo: <code style={{ color: '#818cf8', fontSize: '12px' }}>demo@taskflow.com</code>
            {' / '}
            <code style={{ color: '#818cf8', fontSize: '12px' }}>password123</code>
          </p>
        </div>

        {/* Features */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} color={color} />
              </div>
              <span style={{ fontSize: '12px', color: '#3d5068' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
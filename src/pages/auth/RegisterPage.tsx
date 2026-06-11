import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, ArrowRight, CheckSquare } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import type { RegisterForm } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1).email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

const Field = ({ label, icon: Icon, error, ...props }: any) => {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4d6080', marginBottom: '7px' }}>{label}</label>
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
            fontSize: '13px', color: '#f1f5f9', outline: 'none', transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          }}
        />
      </div>
      {error && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const { register: reg } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  return (
    <div style={{
      minHeight: '100vh', background: '#050c1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
            <CheckSquare size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', marginBottom: '6px' }}>Create your account</h1>
          <p style={{ fontSize: '14px', color: '#4d6080' }}>Start managing tasks with AI in minutes</p>
        </div>

        <div style={{ background: 'linear-gradient(180deg, #0e1c33 0%, #0a1628 100%)', border: '1px solid #1a2e4a', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSubmit(d => reg.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Full name" icon={User} placeholder="John Doe" error={errors.name?.message} {...register('name')} autoFocus />
            <Field label="Email address" icon={Mail} type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
            <Field label="Password" icon={Lock} type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
            <Field label="Confirm password" icon={Lock} type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <button
              type="submit"
              disabled={reg.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px 20px', borderRadius: '11px', marginTop: '6px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: '1px solid rgba(99,102,241,0.4)',
                color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(79,70,229,0.4)', transition: 'all 0.2s',
                opacity: reg.isPending ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!reg.isPending) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              {reg.isPending ? 'Creating account...' : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #0f1e35', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#3d5068' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
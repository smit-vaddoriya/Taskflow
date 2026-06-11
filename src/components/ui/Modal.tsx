import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  showClose?: boolean
}

const maxWidths = { sm: '400px', md: '480px', lg: '560px', xl: '720px', full: '1100px' }

export default function Modal({ isOpen, onClose, title, subtitle, size = 'md', children, showClose = true }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        background: 'rgba(2,7,18,0.85)', backdropFilter: 'blur(16px) saturate(180%)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: maxWidths[size],
          background: 'linear-gradient(180deg, #0e1c33 0%, #0a1628 100%)',
          border: '1px solid #1a2e4a',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.05)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh', overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {(title || showClose) && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid #1a2e4a',
            flexShrink: 0,
          }}>
            {title && (
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{title}</h2>
                {subtitle && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>{subtitle}</p>}
              </div>
            )}
            {showClose && (
              <button
                onClick={onClose}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', marginLeft: 'auto', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#162236'; e.currentTarget.style.color = '#94a3b8' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
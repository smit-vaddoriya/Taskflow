import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import CommandPalette from '../command/CommandPalette'
import { C } from '../../design/tokens'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg0 }}>
      <Sidebar onOpenCmd={() => setCmdOpen(true)} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Navbar onOpenCmd={() => setCmdOpen(true)} />
        <main style={{
          flex: 1, overflowY: 'auto', background: C.bg0,
          backgroundImage: `radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.03) 0%, transparent 50%)`,
        }}>
          {children}
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
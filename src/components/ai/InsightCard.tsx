import React, { useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { useAnalyticsInsight } from '../../services/ai.service'

export default function InsightCard({ metrics }: { metrics: any }) {
  const insight = useAnalyticsInsight()
  useEffect(() => { insight.mutate(metrics) }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%)',
      border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={12} color="#818cf8" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#818cf8', letterSpacing: '0.02em' }}>AI INSIGHT</span>
        </div>
        <button
          onClick={() => insight.mutate(metrics)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a3f63', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#4d6080'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2a3f63'; e.currentTarget.style.background = 'none' }}
        >
          <RefreshCw size={12} style={{ animation: insight.isPending ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
      {insight.isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3d5068', fontSize: '13px' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Analyzing your team's data...
        </div>
      )}
      {insight.data && <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65 }}>{insight.data}</p>}
      {insight.isError && <p style={{ fontSize: '13px', color: '#4d6080' }}>Could not generate insight right now.</p>}
    </div>
  )
}
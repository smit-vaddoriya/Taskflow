import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { VelocityDataPoint } from '../../types'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>)}
    </div>
  )
}

export default function VelocityChart({ data }: { data: VelocityDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} iconType="circle" iconSize={8} />
        <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={2} fill="url(#completedGrad)" dot={false} />
        <Area type="monotone" dataKey="created" name="Created" stroke="#14b8a6" strokeWidth={2} fill="url(#createdGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
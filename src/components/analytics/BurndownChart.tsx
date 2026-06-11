import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BurndownPoint { day: string; ideal: number; actual: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">Day {label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value} pts</p>)}
    </div>
  )
}

export default function BurndownChart({ data, totalPoints }: { data: BurndownPoint[]; totalPoints: number }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, totalPoints]} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#334155" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
        <Line type="monotone" dataKey="actual" name="Actual" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
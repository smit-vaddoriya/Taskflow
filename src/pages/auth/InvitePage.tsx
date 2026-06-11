import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Zap, Loader2, CheckCircle, XCircle } from 'lucide-react'
import apiClient from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return

    if (!user) {
      navigate(`/login?redirect=/invite/${token}`)
      return
    }

    apiClient
      .post(`/orgs/invite/${token}/accept`)
      .then(() => {
        setStatus('success')
        setMessage('You have successfully joined the workspace!')
        setTimeout(() => navigate('/dashboard'), 2000)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.response?.data?.message ?? 'This invite is invalid or has expired.')
      })
  }, [token, user])

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-7 h-7 text-white" />
        </div>

        <div className="card p-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              <p className="text-slate-300">Accepting your invite...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <h2 className="text-lg font-semibold text-slate-100">Welcome aboard!</h2>
              <p className="text-slate-400 text-sm">{message}</p>
              <p className="text-slate-500 text-xs">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-10 h-10 text-red-400" />
              <h2 className="text-lg font-semibold text-slate-100">Invite Failed</h2>
              <p className="text-slate-400 text-sm">{message}</p>
              <Link to="/dashboard">
                <Button variant="secondary">Go to Dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
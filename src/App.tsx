import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import { useAuthStore } from './store/authStore'
import { useSocket } from './hooks/useSocket'

import LoginPage      from './pages/auth/LoginPage'
import RegisterPage   from './pages/auth/RegisterPage'
import OrgSetupPage   from './pages/auth/OrgSetupPage'
import InvitePage     from './pages/auth/InvitePage'
import DashboardPage  from './pages/dashboard/DashboardPage'
import ProjectsPage   from './pages/projects/ProjectsPage'
import BoardPage      from './pages/projects/BoardPage'
import SettingsPage   from './pages/settings/SettingsPage'
import AnalyticsPage  from './pages/analytics/AnalyticsPage'
import AppLayout      from './components/layout/AppLayout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function SocketInit() { useSocket(); return null }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"             element={<DashboardPage />} />
      <Route path="setup"                 element={<OrgSetupPage />} />
      <Route path="projects"              element={<ProjectsPage />} />
      <Route path="projects/:projectId"   element={<BoardPage />} />
      <Route path="analytics"             element={<AnalyticsPage />} />
      <Route path="settings/*"            element={<SettingsPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/invite/:token"  element={<InvitePage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SocketInit />
                <AppLayout>
                  <AppRoutes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
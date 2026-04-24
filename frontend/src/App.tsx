import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { RegistroPage } from './pages/RegistroPage'
import { PacientesPage } from './pages/PacientesPage'
import { MetasPage } from './pages/MetasPage'
import { AuditoriaPage } from './pages/AuditoriaPage'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="registros" element={<RegistroPage />} />
        <Route path="pacientes" element={<PacientesPage />} />
        <Route path="metas" element={<MetasPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
      </Route>
    </Routes>
  )
}

import { useNavigate } from "react-router"
import { useAuth } from "~/contexts/AuthContext"
import { AppLayout } from "~/components/layout/AppLayout"
import { useEffect } from "react"

export default function AuthenticatedLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return <AppLayout />
}

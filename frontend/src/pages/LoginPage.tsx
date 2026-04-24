import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const btnRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // Load GSI script and render button + One Tap
  useEffect(() => {
    if (user) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!window.google) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,         // One Tap auto-select
        cancel_on_tap_outside: false,
      })

      // Render the sign-in button
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        })
      }

      // Show One Tap prompt
      window.google.accounts.id.prompt()
    }

    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleCredentialResponse(response: { credential: string }) {
    setError(null)
    setLoading(true)
    try {
      await login(response.credential)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Falha ao autenticar. Verifique se seu email e do dominio autorizado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
      <div className="glass-card p-8 w-full max-w-sm text-center space-y-6 animate-fade-in">
        {/* Logo / Brand */}
        <div className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Indicadores AD
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Atencao Domiciliar — Health+ Cuidados
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border)]" />

        {/* Google Sign-In Button */}
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Entre com sua conta corporativa
          </p>
          <div ref={btnRef} className="flex justify-center" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
            <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            Autenticando...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] p-3">
            {error}
          </div>
        )}

        {/* Footer */}
        <p className="text-[10px] text-[var(--color-text-muted)] opacity-60">
          Acesso restrito a contas @healthmaiscuidados
        </p>
      </div>
    </div>
  )
}

// GSI type declarations
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (element: HTMLElement, config: {
            theme?: string
            size?: string
            width?: number
            text?: string
            shape?: string
            logo_alignment?: string
          }) => void
          prompt: () => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

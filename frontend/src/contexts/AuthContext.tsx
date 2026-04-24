import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  nome: string
  email: string
  perfil: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('session_token')
    if (!token) {
      setLoading(false)
      return
    }

    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('session_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credential: string) => {
    const res = await api.post('/auth/google', { credential })
    const { token, user: userData } = res.data as { token: string; user: User }
    localStorage.setItem('session_token', token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('session_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

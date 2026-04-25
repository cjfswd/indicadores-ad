import { Activity, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { useTheme } from '~/hooks/useTheme'
import { useAuth } from '~/contexts/AuthContext'

const THEME_CYCLE = ['system', 'light', 'dark'] as const
const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon }

export function MobileHeader() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme)
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  }

  const ThemeIcon = THEME_ICONS[theme]

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-3 py-2.5 bg-[var(--color-surface-1)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
          <Activity size={14} className="text-white" />
        </div>
        <div className="leading-none">
          <span className="text-xs font-bold text-[var(--color-text-primary)]">Indicadores AD</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[var(--color-text-muted)] mr-1 hidden min-[360px]:inline">
          {user?.nome?.split(' ')[0]}
        </span>
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors"
          title="Tema"
        >
          <ThemeIcon size={16} />
        </button>
        <button
          onClick={logout}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-400 hover:bg-[var(--overlay-soft)] transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

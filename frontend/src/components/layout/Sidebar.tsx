import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Target,
  History,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/registros', icon: ClipboardList, label: 'Registros Mensais' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/auditoria', icon: History, label: 'Logs' },
] as const

const THEME_CYCLE = ['system', 'light', 'dark'] as const
const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon }
const THEME_LABELS = { system: 'Sistema', light: 'Claro', dark: 'Escuro' }

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme)
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  }

  const ThemeIcon = THEME_ICONS[theme]

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen sticky top-0 transition-all duration-300 ease-out',
        'bg-[var(--color-surface-1)] border-r border-[var(--color-border)]',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[var(--color-border)]">
        <div className="flex-shrink-0 w-9 h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight leading-none">
              Indicadores AD
            </h1>
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
              Atenção Domiciliar
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-200',
                'text-sm font-medium',
                isActive
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)]',
              )
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className={clsx(
        'flex items-center mx-3 mb-2 px-3 py-2.5 rounded-[var(--radius-md)] overflow-hidden',
        'border border-[var(--color-border)] bg-[var(--overlay-soft)]',
        collapsed ? 'flex-col gap-2 justify-center' : 'gap-3',
      )}>
        <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[var(--color-accent)]">
            {user?.nome?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{user?.nome}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={cycleTheme}
        className={clsx(
          'flex items-center gap-3 mx-3 mb-2 px-3 py-2.5 rounded-[var(--radius-md)]',
          'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
          'hover:bg-[var(--overlay-soft)] transition-colors duration-200',
          'text-sm font-medium',
        )}
        title={`Tema: ${THEME_LABELS[theme]}`}
      >
        <ThemeIcon size={18} className="flex-shrink-0" />
        {!collapsed && <span className="animate-fade-in">{THEME_LABELS[theme]}</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className={clsx(
          'flex items-center justify-center mx-3 mb-4 py-2 rounded-[var(--radius-md)]',
          'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
          'hover:bg-[var(--overlay-soft)] transition-colors duration-200',
        )}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  )
}


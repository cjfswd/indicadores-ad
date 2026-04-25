import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Target,
  History,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/registros', icon: ClipboardList, label: 'Registros' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/auditoria', icon: History, label: 'Logs' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-[var(--color-surface-1)] border-t border-[var(--color-border)] px-1 py-1.5 safe-bottom">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0',
              'text-[10px] font-medium',
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)]',
            )
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

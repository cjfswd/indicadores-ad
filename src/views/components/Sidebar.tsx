import type { FC } from 'hono/jsx'
import { LayoutDashboard, ClipboardList, Users, Target, History, Activity, Sun } from './Icons.js'

interface SidebarProps {
  currentPath: string
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/registros', label: 'Registros Mensais', Icon: ClipboardList },
  { path: '/pacientes', label: 'Pacientes', Icon: Users },
  { path: '/metas', label: 'Metas', Icon: Target },
  { path: '/auditoria', label: 'Logs', Icon: History },
] as const

export const Sidebar: FC<SidebarProps> = ({ currentPath }) => (
  <aside class="w-[260px] bg-(--color-surface-1) border-r border-(--color-border) flex flex-col py-6 fixed top-0 left-0 bottom-0 z-40 transition-transform duration-250 sidebar-mobile-hidden">
    <div class="flex items-center gap-3 px-5 pb-6 border-b border-(--color-border) mb-4">
      <div class="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
        <Activity size={20} class="text-white" />
      </div>
      <a href="/dashboard" class="no-underline">
        <h1 class="text-sm font-bold text-(--color-text-primary) tracking-tight leading-none">Indicadores AD</h1>
        <span class="text-[.6875rem] text-(--color-text-muted) font-medium">Atenção Domiciliar</span>
      </a>
    </div>
    <nav class="flex-1 flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map(({ path, label, Icon }) => (
        <a
          key={path}
          href={path}
          class={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
            currentPath === path
              ? 'bg-(--color-accent)/15 text-(--color-accent) shadow-sm'
              : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-[var(--overlay-soft)]'
          }`}
        >
          <Icon size={20} class="shrink-0" />
          {label}
        </a>
      ))}
    </nav>
    <div class="px-3 pt-4 border-t border-(--color-border)">
      <button
        class="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-[var(--overlay-soft)] transition-colors duration-200 w-full border-none cursor-pointer bg-transparent"
        hx-on:click="toggleTheme()"
      >
        <Sun size={18} class="shrink-0" />
        Alternar Tema
      </button>
    </div>
  </aside>
)

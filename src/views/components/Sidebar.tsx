import type { FC } from 'hono/jsx'

interface SidebarProps {
  currentPath: string
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2zM14 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-5z' },
  { path: '/registros', label: 'Registros Mensais', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  { path: '/pacientes', label: 'Pacientes', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { path: '/metas', label: 'Metas', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { path: '/auditoria', label: 'Auditoria', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
]

export const Sidebar: FC<SidebarProps> = ({ currentPath }) => (
  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="/dashboard" style="text-decoration:none">
        <h1 class="sidebar-title">Indicadores AD</h1>
        <p class="sidebar-subtitle">Health+ Cuidados</p>
      </a>
    </div>
    <nav class="sidebar-nav">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.path}
          href={item.path}
          class={`nav-item ${currentPath === item.path ? 'nav-item-active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d={item.icon} />
          </svg>
          {item.label}
        </a>
      ))}
    </nav>
    <div class="sidebar-footer">
      <button class="nav-item" hx-on:click="toggleTheme()" style="width:100%;border:none;cursor:pointer;background:transparent">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
        Alternar Tema
      </button>
    </div>
  </aside>
)

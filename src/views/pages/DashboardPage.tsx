import type { FC } from 'hono/jsx'
import { MESES } from '../helpers.js'

interface DashboardPageProps {
  title: string
}

export const DashboardPage: FC<DashboardPageProps> = () => (
  <div>
    <div class="page-header">
      <div class="flex items-center gap-3">
        <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(59,130,246,.15);color:#60a5fa;display:flex;align-items:center;justify-content:center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        </div>
        <div><h2>Dashboard</h2><p>Visão consolidada dos indicadores assistenciais</p></div>
      </div>
    </div>
    <div id="dashboard-content" hx-get="/dashboard/content" hx-trigger="load" hx-swap="innerHTML">
      <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">Carregando...</div>
    </div>
  </div>
)

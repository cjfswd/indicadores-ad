import type { FC } from 'hono/jsx'
import { TrendingUp } from '../components/Icons.js'
import { PageHeader } from '../components/PageHeader.js'
import { PAGE } from '../ui.js'

export const DashboardPage: FC = () => (
  <div class={PAGE}>
    <PageHeader
      icon={<TrendingUp size={20} />}
      iconClass="bg-blue-500/15 text-blue-400"
      title="Dashboard"
      subtitle="Visão consolidada dos indicadores assistenciais"
    />
    <div id="dashboard-content" hx-get="/dashboard/content" hx-trigger="load" hx-swap="innerHTML">
      <div class="text-center py-16 text-(--color-text-muted)">Carregando...</div>
    </div>
  </div>
)

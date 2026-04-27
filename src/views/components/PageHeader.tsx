import type { FC } from 'hono/jsx'

interface PageHeaderProps {
  icon: unknown
  iconClass: string
  title: string
  subtitle: string
  actions?: unknown
}

export const PageHeader: FC<PageHeaderProps> = ({ icon, iconClass, title, subtitle, actions }) => (
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
        {icon}
      </div>
      <div>
        <h2 class="text-lg sm:text-2xl font-bold text-(--color-text-primary)">{title}</h2>
        <p class="text-sm text-(--color-text-muted) mt-0.5">{subtitle}</p>
      </div>
    </div>
    {actions && <div class="flex items-center gap-3">{actions}</div>}
  </div>
)

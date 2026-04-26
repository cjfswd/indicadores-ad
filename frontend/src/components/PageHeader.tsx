import type { ReactNode } from 'react'

interface PageHeaderProps {
  icon: ReactNode
  iconClassName?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ icon, iconClassName = '', title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-md)] flex items-center justify-center ${iconClassName}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

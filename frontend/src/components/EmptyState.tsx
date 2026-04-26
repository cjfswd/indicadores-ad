import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  message: string
  hint?: string
}

export function EmptyState({ icon, message, hint }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-[var(--color-text-muted)]">
      <div className="mx-auto mb-3 opacity-20 w-fit">{icon}</div>
      <p className="text-sm font-medium">{message}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  )
}

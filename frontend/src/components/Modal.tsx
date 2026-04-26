import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

const MAX_W: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, subtitle, children, actions, maxWidth = 'md' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full glass-card p-6 animate-fade-in', MAX_W[maxWidth])}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
            {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
        {actions && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--overlay-border)]">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

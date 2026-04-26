import { type ReactNode, useState } from 'react'
import { clsx } from 'clsx'
import { AnexoInput } from '@/components/AnexoInput'

type Variant = 'danger' | 'warning' | 'success' | 'default'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (justificativa: string, arquivo: File | null) => void
  title: string
  subtitle?: string
  description?: string
  icon?: ReactNode
  confirmLabel?: string
  variant?: Variant
  placeholder?: string
  maxWidth?: 'sm' | 'md'
  loading?: boolean
  /** Extra content rendered between description and justificativa field */
  children?: ReactNode
  /** Context lines shown below subtitle (label → value) */
  contextLines?: { label: string; value: string }[]
}

const VARIANT_RING: Record<Variant, string> = {
  danger: 'focus:ring-red-500/50',
  warning: 'focus:ring-amber-500/50',
  success: 'focus:ring-emerald-500/50',
  default: 'focus:ring-[var(--color-accent)]/50',
}

const VARIANT_BTN: Record<Variant, { enabled: string; label: string }> = {
  danger: { enabled: 'bg-red-600 text-white hover:bg-red-500', label: 'Excluir' },
  warning: { enabled: 'bg-amber-600 text-white hover:bg-amber-500', label: 'Confirmar' },
  success: { enabled: 'bg-emerald-600 text-white hover:bg-emerald-500', label: 'Confirmar' },
  default: { enabled: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]', label: 'Confirmar' },
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, subtitle, description, icon,
  confirmLabel, variant = 'default', placeholder = 'Justificativa...',
  maxWidth = 'sm', loading = false, children, contextLines,
}: ConfirmDialogProps) {
  const [justificativa, setJustificativa] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)

  if (!open) return null

  const canConfirm = justificativa.trim().length > 0 && !loading
  const btnConfig = VARIANT_BTN[variant]
  const label = confirmLabel ?? btnConfig.label
  const mw = maxWidth === 'sm' ? 'max-w-sm' : 'max-w-md'

  const handleClose = () => {
    setJustificativa(''); setArquivo(null); onClose()
  }

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm(justificativa, arquivo)
    setJustificativa(''); setArquivo(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className={clsx('relative w-full glass-card p-6 animate-fade-in', mw)}>
        {icon && <div className="mb-3">{icon}</div>}
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-text-muted)] mb-2">{subtitle}</p>}
        {contextLines && contextLines.length > 0 && (
          <div className="mb-3 space-y-1">
            {contextLines.map((line, i) => (
              <p key={i} className="text-sm text-[var(--color-text-muted)]">
                {line.label}: <span className="text-[var(--color-text-primary)] font-semibold">{line.value}</span>
              </p>
            ))}
          </div>
        )}
        {description && <p className="text-sm text-[var(--color-text-muted)] mb-4">{description}</p>}
        {children && <div className="mb-4">{children}</div>}

        <label className="flex flex-col gap-1.5 mb-4">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Justificativa <span className="text-red-400">*</span></span>
          <textarea
            value={justificativa}
            onChange={e => setJustificativa(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
            className={clsx(
              'w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 resize-none',
              VARIANT_RING[variant],
            )}
          />
        </label>

        <div className="mb-4">
          <AnexoInput arquivo={arquivo} onChange={setArquivo} />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={handleClose}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!canConfirm}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
              canConfirm ? btnConfig.enabled : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
            )}>
            {label}
          </button>
        </div>
      </div>
    </div>
  )
}

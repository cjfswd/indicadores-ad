import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { SemaforoItem } from '~/lib/mock-data'
import { statusLabel } from '~/lib/chart-helpers'

const STATUS_STYLES = {
  verde: {
    dot: 'bg-[var(--color-semaforo-verde)]',
    glow: 'glow-verde',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  amarelo: {
    dot: 'bg-[var(--color-semaforo-amarelo)]',
    glow: 'glow-amarelo',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
    text: 'text-amber-400',
  },
  vermelho: {
    dot: 'bg-[var(--color-semaforo-vermelho)]',
    glow: 'glow-vermelho',
    border: 'border-red-500/20',
    bar: 'bg-red-500',
    text: 'text-red-400',
  },
  neutro: {
    dot: 'bg-[var(--color-semaforo-neutro)]',
    glow: '',
    border: 'border-blue-500/20',
    bar: 'bg-blue-500',
    text: 'text-blue-400',
  },
} as const

interface SemaforoCardProps {
  item: SemaforoItem
  index: number
  onClick?: () => void
}

export function SemaforoCard({ item, index, onClick }: SemaforoCardProps) {
  const styles = STATUS_STYLES[item.status]
  const progressPct = item.meta && item.meta > 0
    ? Math.min(100, Math.round((item.valor / item.meta) * 100))
    : null

  return (
    <button
      onClick={onClick}
      className={clsx(
        'glass-card p-3 sm:p-4 text-left w-full transition-all duration-200 animate-fade-in',
        styles.glow,
        styles.border,
        'hover:scale-[1.02] active:scale-[0.99]',
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className={clsx('w-2.5 h-2.5 rounded-full animate-pulse-dot', styles.dot)} />
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {item.codigo}
          </span>
        </div>
        {item.variacao != null && (
          <span className={clsx(
            'inline-flex items-center gap-0.5 text-[11px] font-semibold',
            item.variacao > 0 ? 'text-emerald-400' : item.variacao < 0 ? 'text-red-400' : 'text-[var(--color-text-muted)]',
          )}>
            {item.variacao > 0 ? <TrendingUp size={11} /> : item.variacao < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {item.variacao > 0 && '+'}{item.variacao}{item.unidade === '%' ? 'pp' : ''}
          </span>
        )}
      </div>

      {/* Name + Value */}
      <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-tight mb-1 truncate">
        {item.nome}
      </p>
      <p className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
        {item.valor}{item.unidade === '%' ? '%' : ''}
      </p>

      {/* Status label */}
      <p className={clsx('text-[10px] font-medium mt-1', styles.text)}>
        {statusLabel(item.status)}
      </p>

      {/* Progress bar */}
      {progressPct != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mb-1">
            <span>Progresso</span>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--overlay-soft)] overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-500', styles.bar)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtypes Bar */}
      {item.subtipos.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {item.subtipos.map((sub) => (
            <div key={sub.nome} className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--color-text-muted)] truncate mr-2">{sub.nome}</span>
              <span className="text-[var(--color-text-secondary)] font-medium tabular-nums">{sub.valor}</span>
            </div>
          ))}
        </div>
      )}

      {/* Meta info */}
      {item.meta != null && (
        <div className="mt-2 pt-2 border-t border-[var(--overlay-border)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Meta: {item.meta}{item.unidade === '%' ? '%' : ''}
          </span>
          {item.alerta != null && (
            <span className="text-[10px] text-amber-400">
              Alerta: {item.alerta}{item.unidade === '%' ? '%' : ''}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

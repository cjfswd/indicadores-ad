import type { FC } from 'hono/jsx'
import { Info } from '../components/Icons.js'
import { CARD } from '../ui.js'

interface SemaforoIndicador {
  codigo: string
  nome: string
  valor: number | null
  meta: number | null
  alerta: number | null
  sentido: string
  status: string
}

const GLOW: Record<string, string> = {
  verde: 'shadow-(--shadow-glow-verde) border-emerald-500/20',
  amarelo: 'shadow-(--shadow-glow-amarelo) border-amber-500/20',
  vermelho: 'shadow-(--shadow-glow-vermelho) border-red-500/20',
}
const DOT: Record<string, string> = {
  verde: 'bg-(--color-semaforo-verde)',
  amarelo: 'bg-(--color-semaforo-amarelo)',
  vermelho: 'bg-(--color-semaforo-vermelho)',
  neutro: 'bg-(--color-semaforo-neutro)',
}
const BAR: Record<string, string> = {
  verde: 'bg-emerald-500',
  amarelo: 'bg-amber-500',
  vermelho: 'bg-red-500',
  neutro: 'bg-blue-500',
}
const STATUS_TEXT: Record<string, string> = {
  verde: 'text-emerald-400',
  amarelo: 'text-amber-400',
  vermelho: 'text-red-400',
  neutro: 'text-blue-400',
}
const STATUS_LABEL: Record<string, string> = {
  verde: 'Dentro da meta',
  amarelo: 'Atenção',
  vermelho: 'Fora da meta',
  neutro: 'Sem meta',
}

export const SemaforoGrid: FC<{ indicadores: SemaforoIndicador[] }> = ({ indicadores }) => {
  if (!indicadores || indicadores.length === 0) {
    return (
      <div class="text-center py-12 px-4 text-(--color-text-muted)">
        <Info size={48} class="mx-auto mb-4 opacity-40" />
        <p class="text-sm">Nenhum registro encontrado para este período.</p>
      </div>
    )
  }
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {indicadores.map((ind, i) => {
        const fmtValor = (typeof ind.valor !== 'number') ? '—' : (ind.valor % 1 !== 0 ? `${ind.valor.toFixed(1)}%` : String(ind.valor))
        const progressPct = ind.meta && ind.meta > 0 && typeof ind.valor === 'number'
          ? Math.min(100, Math.round((ind.valor / ind.meta) * 100))
          : null
        return (
          <div
            class={`${CARD} hover:scale-[1.02] active:scale-[0.99] ${GLOW[ind.status] ?? ''}`}
            style={`animation:fadeIn .3s ease ${i * 60}ms both`}
          >
            {/* Header */}
            <div class="flex items-center justify-between mb-2 sm:mb-3">
              <div class="flex items-center gap-2">
                <span class={`w-2.5 h-2.5 rounded-full inline-block animate-[pulse-dot_2s_ease-in-out_infinite] ${DOT[ind.status] ?? DOT.neutro}`}></span>
                <span class="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">{ind.codigo}</span>
              </div>
            </div>

            {/* Name + Value */}
            <p class="text-sm font-medium text-(--color-text-secondary) leading-tight mb-1 truncate">{ind.nome}</p>
            <p class="text-xl sm:text-2xl font-bold text-(--color-text-primary) tabular-nums">{fmtValor}</p>

            {/* Status label */}
            <p class={`text-[.625rem] font-medium mt-1 ${STATUS_TEXT[ind.status] ?? STATUS_TEXT.neutro}`}>
              {STATUS_LABEL[ind.status] ?? STATUS_LABEL.neutro}
            </p>

            {/* Progress bar */}
            {progressPct !== null && (
              <div class="mt-3">
                <div class="flex items-center justify-between text-[.625rem] text-(--color-text-muted) mb-1">
                  <span>Progresso</span>
                  <span class="tabular-nums">{progressPct}%</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[var(--overlay-soft)] overflow-hidden">
                  <div
                    class={`h-full rounded-full transition-all duration-500 ${BAR[ind.status] ?? BAR.neutro}`}
                    style={`width:${progressPct}%`}
                  ></div>
                </div>
              </div>
            )}

            {/* Meta info */}
            {ind.meta !== null && (
              <div class="mt-2 pt-2 border-t border-[var(--overlay-border)] flex items-center justify-between">
                <span class="text-[.625rem] text-(--color-text-muted)">
                  Meta: {ind.meta}{['01','03','05'].includes(ind.codigo) ? '%' : ''}
                </span>
                {ind.alerta !== null && (
                  <span class="text-[.625rem] text-amber-400">
                    Alerta: {ind.alerta}{['01','03','05'].includes(ind.codigo) ? '%' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

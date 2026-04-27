import type { FC } from 'hono/jsx'
import { INDICADOR_LABELS, SENTIDO_CONFIG, MESES_CURTOS, isMonthActive, ICON_COLORS } from '../helpers.js'
import { Pencil } from '../components/Icons.js'
import { CARD, BTN_ICON } from '../ui.js'

interface Meta {
  indicador_codigo: string; meta_valor: number | null; limite_alerta: number | null
  sentido: string; mes_inicio: number | null; mes_fim: number | null
}

export const MetasTable: FC<{ metas: Meta[]; ano: number }> = ({ metas, ano }) => {
  const sorted = [...metas].sort((a, b) => a.indicador_codigo.localeCompare(b.indicador_codigo))
  if (sorted.length === 0) {
    return <div class="text-center py-16 text-(--color-text-muted)"><p class="text-sm">Nenhuma meta definida para {ano}</p></div>
  }
  return (
    <div class="flex flex-col gap-3">
      {sorted.map((meta, i) => {
        const codigo = meta.indicador_codigo
        const nome = INDICADOR_LABELS[codigo] ?? codigo
        const sentido = SENTIDO_CONFIG[meta.sentido] ?? SENTIDO_CONFIG.neutro
        return (
          <div class={`${CARD} !py-3`} style={`animation:fadeIn .3s ease ${i * 40}ms both`}>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold`} style={`color:${ICON_COLORS[codigo]?.color ?? '#a78bfa'};background:${ICON_COLORS[codigo]?.bg ?? 'rgba(139,92,246,.15)'}`}>{codigo}</span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-(--color-text-primary) truncate">{nome}</p>
                  <p class={`text-[.625rem] font-medium ${sentido.cls}`}>{sentido.arrow} {sentido.label}</p>
                </div>
              </div>
              <div class="hidden sm:flex gap-0.5 items-center">
                {Array.from({ length: 12 }, (_, m) => m + 1).map(m => (
                  <div class={`w-6 h-1 rounded-sm ${isMonthActive(m, meta.mes_inicio ?? 1, meta.mes_fim ?? 12) ? sentido.barCls : 'bg-(--color-surface-2)'}`} title={MESES_CURTOS[m]}></div>
                ))}
              </div>
              <div class="flex items-center gap-3 text-right">
                <div>
                  <div class="text-[.625rem] text-(--color-text-muted) uppercase font-semibold">Meta</div>
                  <div class={`text-base font-bold tabular-nums ${meta.meta_valor != null ? 'text-(--color-text-primary)' : 'text-(--color-text-muted)'}`}>{meta.meta_valor != null ? meta.meta_valor : '—'}</div>
                </div>
                <div>
                  <div class="text-[.625rem] text-(--color-text-muted) uppercase font-semibold">Alerta</div>
                  <div class={`text-base font-bold tabular-nums ${meta?.limite_alerta != null ? 'text-amber-300' : 'text-(--color-text-muted)'}`}>{meta?.limite_alerta != null ? meta.limite_alerta : '—'}</div>
                </div>
                <button class={BTN_ICON} hx-get={`/metas/modal/editar?codigo=${codigo}&ano=${ano}`} hx-target="#modal-container" hx-swap="innerHTML" title="Editar meta">
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

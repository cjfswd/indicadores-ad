import type { FC } from 'hono/jsx'
import { INDICADOR_LABELS, SENTIDO_CONFIG, MESES_CURTOS, isMonthActive, ICON_COLORS } from '../helpers.js'

interface Meta {
  indicador_codigo: string; meta_valor: number | null; limite_alerta: number | null
  sentido: string; mes_inicio: number | null; mes_fim: number | null
}

export const MetasTable: FC<{ metas: Meta[]; ano: number }> = ({ metas, ano }) => {
  const codigos = Object.keys(INDICADOR_LABELS)
  return (
    <div class="space-y-3">
      {codigos.map((codigo, i) => {
        const meta = metas.find((m) => m.indicador_codigo === codigo)
        const sentido = meta?.sentido ?? 'neutro'
        const sc = SENTIDO_CONFIG[sentido] ?? SENTIDO_CONFIG['neutro']
        const ic = ICON_COLORS[codigo] ?? { color: '#60a5fa', bg: 'rgba(59,130,246,.15)' }
        const inicio = meta?.mes_inicio ?? 1
        const fim = meta?.mes_fim ?? 12
        return (
          <div class="glass-card no-hover" style={`padding:1rem;animation:fadeIn .3s ease ${i * 40}ms both`}>
            <div class="flex items-center justify-between" style="margin-bottom:.5rem;flex-wrap:wrap;gap:.5rem">
              <div class="flex items-center gap-3">
                <span style={`width:1.75rem;height:1.75rem;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:.6875rem;font-weight:700;background:${ic.bg};color:${ic.color}`}>{codigo}</span>
                <div>
                  <span style="font-weight:600;color:var(--color-text-primary)">{INDICADOR_LABELS[codigo]}</span>
                  <div><span style={`font-size:.6875rem;font-weight:500;color:${sc.color};background:${sc.bg};padding:.125rem .375rem;border-radius:.25rem`}>{sc.label}</span></div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div style="text-align:right">
                  <div style="font-size:.625rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em">META</div>
                  <div style="font-size:1rem;font-weight:700;color:var(--color-text-primary);font-variant-numeric:tabular-nums">{meta?.meta_valor != null ? meta.meta_valor : '—'}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:.625rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em">ALERTA</div>
                  <div style={`font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;color:${meta?.limite_alerta != null ? '#fbbf24' : 'var(--color-text-muted)'}`}>{meta?.limite_alerta != null ? meta.limite_alerta : '—'}</div>
                </div>
                <button class="btn btn-sm btn-ghost" hx-get={`/metas/modal/editar?codigo=${codigo}&ano=${ano}`} hx-target="#modal-container" hx-swap="innerHTML" title="Editar meta">✏️</button>
              </div>
            </div>
            <div class="flex gap-1" style="margin-top:.5rem">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const active = isMonthActive(m, inicio, fim)
                return (
                  <div style={`flex:1;height:4px;border-radius:2px;background:${active ? sc.color : 'var(--overlay-soft)'};opacity:${active ? 1 : 0.3}`} title={`${MESES_CURTOS[m]}: ${active ? 'ativo' : 'inativo'}`}></div>
                )
              })}
            </div>
            <div class="flex gap-1" style="margin-top:.25rem">
              {MESES_CURTOS.map((m, i) => i > 0 ? <span style="flex:1;text-align:center;font-size:.5rem;color:var(--color-text-muted);opacity:.6">{m}</span> : null)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

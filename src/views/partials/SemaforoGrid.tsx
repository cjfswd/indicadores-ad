import type { FC } from 'hono/jsx'

interface SemaforoIndicador {
  codigo: string
  nome: string
  valor: number | null
  meta: number | null
  alerta: number | null
  sentido: string
  status: string
}

export const SemaforoGrid: FC<{ indicadores: SemaforoIndicador[] }> = ({ indicadores }) => {
  if (!indicadores || indicadores.length === 0) {
    return (
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <p>Nenhum registro encontrado para este período.</p>
      </div>
    )
  }
  return (
    <div class="semaforo-grid">
      {indicadores.map(ind => {
        const fmtValor = (typeof ind.valor !== 'number') ? '—' : (ind.valor % 1 !== 0 ? `${ind.valor.toFixed(1)}%` : String(ind.valor))
        return (
          <div class={`glass-card semaforo-card glow-${ind.status}`}>
            <div class="flex items-center justify-between">
              <span class="indicator-code">Indicador {ind.codigo}</span>
              <span class={`semaforo-dot dot-${ind.status}`}></span>
            </div>
            <div class="indicator-name">{ind.nome}</div>
            <div class="flex items-center gap-3">
              <span class="indicator-value" style={`color: var(--color-semaforo-${ind.status})`}>{fmtValor}</span>
              <span class={`badge badge-${ind.status}`}>{ind.status.charAt(0).toUpperCase() + ind.status.slice(1)}</span>
            </div>
            <div class="indicator-meta">
              {ind.meta !== null
                ? <>Meta: {ind.meta}{ind.sentido !== 'neutro' && ['01','03','05'].includes(ind.codigo) ? '%' : ''}{ind.alerta !== null ? ` · Alerta: ${ind.alerta}` : ''}</>
                : 'Sem meta definida'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

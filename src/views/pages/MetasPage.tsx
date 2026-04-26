import type { FC } from 'hono/jsx'

export const MetasPage: FC = () => {
  const anoAtual = new Date().getFullYear()
  return (
    <div>
      <div class="page-header">
        <div class="flex items-center gap-3">
          <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(245,158,11,.15);color:#fbbf24;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          <div><h2>Metas</h2><p>Configuração de metas e limites de alerta por indicador</p></div>
        </div>
        <div class="flex items-center gap-3">
          <select class="form-select" style="width:auto" name="metasAno" hx-get="/metas/content" hx-target="#metas-content" hx-swap="innerHTML">
            {[2025, 2026, 2027].map(y => <option value={y} selected={y === anoAtual}>{y}</option>)}
          </select>
          <button class="btn btn-primary" hx-get="/metas/modal/editar" hx-target="#modal-container" hx-swap="innerHTML">+ Definir Meta</button>
        </div>
      </div>
      <div id="metas-content" hx-get="/metas/content" hx-trigger="load" hx-swap="innerHTML">
        <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">Carregando...</div>
      </div>
    </div>
  )
}

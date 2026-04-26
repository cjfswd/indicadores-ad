import type { FC } from 'hono/jsx'
import { MESES } from '../helpers.js'

export const RegistrosPage: FC = () => {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  return (
    <div>
      <div class="page-header">
        <div class="flex items-center gap-3">
          <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(16,185,129,.15);color:#34d399;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /></svg>
          </div>
          <div><h2>Registros Mensais</h2><p>Registro de indicadores e eventos por período</p></div>
        </div>
      </div>
      <div class="glass-card no-hover" style="padding:.75rem 1rem;margin-bottom:1rem">
        <div class="flex items-center gap-3" style="flex-wrap:wrap">
          <span style="font-size:.75rem;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em">Período</span>
          <select class="form-select" style="width:auto" name="regMes" hx-get="/registros/content" hx-target="#registro-content" hx-include="[name='regAno']" hx-swap="innerHTML">
            {MESES.map((m, i) => i > 0 ? <option value={i} selected={i === mesAtual}>{m}</option> : null)}
          </select>
          <select class="form-select" style="width:auto" name="regAno" hx-get="/registros/content" hx-target="#registro-content" hx-include="[name='regMes']" hx-swap="innerHTML">
            {[2025, 2026, 2027].map(y => <option value={y} selected={y === anoAtual}>{y}</option>)}
          </select>
        </div>
      </div>
      <div id="registro-content" hx-get="/registros/content" hx-trigger="load" hx-swap="innerHTML">
        <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">Carregando...</div>
      </div>
    </div>
  )
}

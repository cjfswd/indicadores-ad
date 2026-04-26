import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import { MESES } from '../helpers.js'
import { SemaforoGrid } from './SemaforoGrid.js'

interface DashboardContentProps {
  ano: number
  mes: number
  registro: Record<string, unknown> | null | undefined
  indicadores: Array<{ codigo: string; nome: string; valor: number | null; meta: number | null; alerta: number | null; sentido: string; status: string }>
}

export const DashboardContent: FC<DashboardContentProps> = ({ ano, mes, registro, indicadores }) => {
  const num = (v: unknown) => Number(v ?? 0)
  const r = registro
  const pacientesTotal = num(r?.pacientes_total)
  const pacientesAD = num(r?.pacientes_ad)
  const pacientesID = num(r?.pacientes_id)
  const eventosAdversos = num(r?.eventos_adversos_total)
  const taxaAltas = num(r?.taxa_altas_pct)

  return (
    <>
      {/* Period selector */}
      <div class="glass-card no-hover" style="padding:.75rem 1rem;position:relative;z-index:10">
        <div class="flex items-center gap-3" style="flex-wrap:wrap">
          <span style="font-size:.75rem;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em">Período</span>
          <select class="form-select" style="width:auto" name="mes" hx-get="/dashboard/content" hx-target="#dashboard-content" hx-include="[name='ano']" hx-swap="innerHTML">
            {MESES.map((m, i) => i > 0 ? <option value={i} selected={i === mes}>{m}</option> : null)}
          </select>
          <select class="form-select" style="width:auto" name="ano" hx-get="/dashboard/content" hx-target="#dashboard-content" hx-include="[name='mes']" hx-swap="innerHTML">
            {[2025, 2026, 2027].map(y => <option value={y} selected={y === ano}>{y}</option>)}
          </select>
          <div style="width:1px;height:1.25rem;background:var(--color-border);margin:0 .25rem"></div>
          <a href={`/api/v1/relatorio/excel/${ano}/${mes}`} target="_blank" class="btn btn-sm" style="background:#059669;color:white">Excel</a>
          <a href={`/api/v1/relatorio/pdf/${ano}/${mes}`} target="_blank" class="btn btn-primary btn-sm">PDF</a>
        </div>
      </div>

      {/* KPI Cards */}
      <div class="grid grid-3 gap-4">
        <div class="glass-card no-hover" style="padding:1.25rem">
          <div class="flex items-center gap-3" style="margin-bottom:.75rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(59,130,246,.15);color:#60a5fa;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
            <div>
              <p style="font-size:.75rem;color:var(--color-text-muted);font-weight:500">Pacientes Ativos</p>
              <p style="font-size:1.5rem;font-weight:700;color:var(--color-text-primary);font-variant-numeric:tabular-nums">{pacientesTotal}</p>
            </div>
          </div>
          <p style="font-size:.6875rem;color:var(--color-text-muted)">{pacientesAD} AD · {pacientesID} ID</p>
        </div>
        <div class="glass-card no-hover" style="padding:1.25rem">
          <div class="flex items-center gap-3" style="margin-bottom:.75rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(239,68,68,.15);color:#f87171;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <div>
              <p style="font-size:.75rem;color:var(--color-text-muted);font-weight:500">Eventos Adversos</p>
              <p style="font-size:1.5rem;font-weight:700;color:var(--color-text-primary);font-variant-numeric:tabular-nums">{eventosAdversos}</p>
            </div>
          </div>
        </div>
        <div class="glass-card no-hover" style="padding:1.25rem">
          <div class="flex items-center gap-3" style="margin-bottom:.75rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(16,185,129,.15);color:#34d399;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <div>
              <p style="font-size:.75rem;color:var(--color-text-muted);font-weight:500">Taxa de Altas</p>
              <p style="font-size:1.5rem;font-weight:700;color:var(--color-text-primary);font-variant-numeric:tabular-nums">{taxaAltas}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Semáforos */}
      <div>
        <h3 style="font-size:.875rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:1rem">Indicadores — Semáforos</h3>
        <SemaforoGrid indicadores={indicadores} />
      </div>
    </>
  )
}

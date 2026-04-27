import type { FC } from 'hono/jsx'
import { MESES } from '../helpers.js'
import { SemaforoGrid } from './SemaforoGrid.js'
import { Users, AlertTriangle, TrendingUp, CalendarRange, FileSpreadsheet, Download } from '../components/Icons.js'
import { CARD, CARD_SM, SELECT, BTN_SM } from '../ui.js'

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
    <div class="flex flex-col gap-4 sm:gap-6">
      {/* Period selector */}
      <div class={`${CARD_SM} relative z-10`}>
        <div class="flex items-center gap-3 flex-wrap">
          <CalendarRange size={14} class="text-(--color-accent)" />
          <span class="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide">Período</span>
          <select class={SELECT} name="mes" hx-get="/dashboard/content" hx-target="#dashboard-content" hx-include="[name='ano']" hx-swap="innerHTML">
            {MESES.map((m, i) => i > 0 ? <option value={i} selected={i === mes}>{m}</option> : null)}
          </select>
          <select class={SELECT} name="ano" hx-get="/dashboard/content" hx-target="#dashboard-content" hx-include="[name='mes']" hx-swap="innerHTML">
            {[2025, 2026, 2027].map(y => <option value={y} selected={y === ano}>{y}</option>)}
          </select>
          <div class="w-px h-5 bg-(--color-border) mx-1"></div>
          <a href={`/api/v1/relatorio/excel/${ano}/${mes}`} target="_blank" class={`${BTN_SM} bg-emerald-600 text-white no-underline hover:bg-emerald-500`}>
            <FileSpreadsheet size={14} /> Excel
          </a>
          <a href={`/api/v1/relatorio/pdf/${ano}/${mes}`} target="_blank" class={`${BTN_SM} bg-(--color-accent) text-white no-underline hover:bg-(--color-accent-hover)`}>
            <Download size={14} /> PDF
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<Users size={20} />}
          iconClass="bg-blue-500/15 text-blue-400"
          label="Pacientes Ativos"
          valor={pacientesTotal}
          descricao={`${pacientesAD} em Atenção Domiciliar (AD) e ${pacientesID} em Internação Domiciliar (ID)`}
          delay={0}
        />
        <KpiCard
          icon={<AlertTriangle size={20} />}
          iconClass="bg-red-500/15 text-red-400"
          label="Eventos Adversos"
          valor={eventosAdversos}
          descricao="Inclui quedas, broncoaspiração, lesão por pressão, decanulação e saída de GTT"
          delay={60}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          iconClass="bg-emerald-500/15 text-emerald-400"
          label="Taxa de Altas"
          valor={`${taxaAltas}%`}
          descricao="Percentual de pacientes que receberam alta domiciliar no período"
          delay={120}
        />
      </div>

      {/* Semáforos */}
      <div>
        <h3 class="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wider mb-4">Indicadores — Semáforos</h3>
        <SemaforoGrid indicadores={indicadores} />
      </div>
    </div>
  )
}

/* ─── Sub-component ─── */
const KpiCard: FC<{ icon: unknown; iconClass: string; label: string; valor: string | number; descricao: string; delay: number }> = ({ icon, iconClass, label, valor, descricao, delay }) => (
  <div class={`${CARD} animate-[fade-in_.3s_ease_${delay}ms_both]`}>
    <div class="flex items-center gap-3 mb-3">
      <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p class="text-xs text-(--color-text-muted) font-medium uppercase tracking-wider">{label}</p>
        <p class="text-2xl sm:text-3xl font-bold text-(--color-text-primary) tabular-nums mt-0.5">{valor}</p>
      </div>
    </div>
    <p class="text-[.6875rem] text-(--color-text-muted) leading-relaxed">{descricao}</p>
  </div>
)

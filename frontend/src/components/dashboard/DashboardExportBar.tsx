import { Download, FileSpreadsheet, CalendarRange } from 'lucide-react'
import { PeriodoSelector } from '@/components/dashboard/PeriodoSelector'

interface DashboardExportBarProps {
  ano: number
  mes: number
  onPeriodoChange: (ano: number, mes: number) => void
  useDateRange: boolean
  rangeInicio: string
  rangeFim: string
  onUseDateRangeChange: (v: boolean) => void
  onRangeInicioChange: (v: string) => void
  onRangeFimChange: (v: string) => void
  loading: boolean
  exporting: boolean
}

export function DashboardExportBar({
  ano, mes, onPeriodoChange,
  useDateRange, rangeInicio, rangeFim,
  onUseDateRangeChange, onRangeInicioChange, onRangeFimChange,
  loading, exporting,
}: DashboardExportBarProps) {
  return (
    <div className="glass-card p-3 sm:p-4 space-y-3 relative z-10">
      <div className="flex flex-wrap items-center gap-3">
        <CalendarRange size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Período</span>
        <PeriodoSelector ano={ano} mes={mes} onChange={onPeriodoChange} />
        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
        <button onClick={() => window.open(`/api/v1/relatorio/excel/${ano}/${mes}`, '_blank')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
          <FileSpreadsheet size={14} /> Excel
        </button>
        <button onClick={() => window.open(`/api/v1/relatorio/pdf/${ano}/${mes}`, '_blank')}
          disabled={exporting || loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50">
          <Download size={14} /> {exporting ? 'Gerando...' : 'PDF'}
        </button>
      </div>

      {/* Date range toggle */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--overlay-border)]">
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
          <input type="checkbox" checked={useDateRange} onChange={e => onUseDateRangeChange(e.target.checked)}
            className="rounded border-[var(--color-border)]" />
          Filtrar por período customizado
        </label>
        {useDateRange && (
          <>
            <input type="month" value={rangeInicio} onChange={e => onRangeInicioChange(e.target.value)}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)]" />
            <span className="text-xs text-[var(--color-text-muted)]">até</span>
            <input type="month" value={rangeFim} onChange={e => onRangeFimChange(e.target.value)}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)]" />
          </>
        )}
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)] italic">
        ⚙ A seleção de período se aplica globalmente a todos os dados e indicadores do sistema.
      </p>
    </div>
  )
}

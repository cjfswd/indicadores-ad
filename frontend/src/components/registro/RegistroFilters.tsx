import { Users, LayoutGrid, X, Calendar } from 'lucide-react'
import { Combobox } from '@/components/Combobox'

interface RegistroFiltersProps {
  ano: number
  mes: number
  onAnoChange: (v: number) => void
  onMesChange: (v: number) => void
  filtroPaciente: string
  filtroOperadora: string
  filtroGrupo: string
  onFiltroPacienteChange: (v: string) => void
  onFiltroOperadoraChange: (v: string) => void
  onFiltroGrupoChange: (v: string) => void
  pacienteOptions: { value: string; label: string; sublabel?: string }[]
  operadoraOptions: { value: string; label: string }[]
  grupoOptions: { value: string; label: string }[]
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function RegistroFilters({
  ano, mes, onAnoChange, onMesChange,
  filtroPaciente, filtroOperadora, filtroGrupo,
  onFiltroPacienteChange, onFiltroOperadoraChange, onFiltroGrupoChange,
  pacienteOptions, operadoraOptions, grupoOptions,
}: RegistroFiltersProps) {
  const temFiltroAtivo = !!(filtroPaciente || filtroOperadora || filtroGrupo)

  const limpar = () => {
    onFiltroPacienteChange(''); onFiltroOperadoraChange(''); onFiltroGrupoChange('')
  }

  return (
    <div className="glass-card relative z-10">
      {/* Month/Year selector */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-[var(--overlay-border)] bg-[var(--overlay-soft)] flex-wrap">
        <Calendar size={14} className="text-[var(--color-accent)]" />
        <select value={mes} onChange={e => onMesChange(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-all">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={ano} onChange={e => onAnoChange(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-all">
          {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
        {temFiltroAtivo && (
          <button onClick={limpar}
            className="text-[10px] text-[var(--color-text-muted)] hover:text-red-400 flex items-center gap-0.5 transition-colors">
            <X size={10} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Filter fields */}
      <div className="px-3 sm:px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Users size={10} /> Operadora
            </span>
            <Combobox options={operadoraOptions} value={filtroOperadora} onChange={onFiltroOperadoraChange}
              placeholder="Buscar operadora..." emptyLabel="Todas" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Users size={10} /> Paciente
            </span>
            <Combobox options={pacienteOptions} value={filtroPaciente} onChange={onFiltroPacienteChange}
              placeholder="Buscar paciente..." emptyLabel="Todos" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
              <LayoutGrid size={10} /> Indicador
            </span>
            <Combobox options={grupoOptions} value={filtroGrupo} onChange={onFiltroGrupoChange}
              placeholder="Buscar indicador..." emptyLabel="Todos" />
          </div>
        </div>
      </div>
    </div>
  )
}

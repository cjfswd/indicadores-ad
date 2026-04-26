import { ChevronDown, ChevronRight } from 'lucide-react'
import { PacienteListItem, type PacienteLocal } from './PacienteListItem'

interface PacienteConvenioGroupProps {
  convenio: string
  lista: PacienteLocal[]
  index: number
  expanded: boolean
  onToggle: () => void
  onEdit: (p: PacienteLocal) => void
  onDelete: (id: string) => void
  onDesativar: (id: string) => void
  onReativar: (id: string) => void
}

export function PacienteConvenioGroup({
  convenio, lista, index, expanded, onToggle,
  onEdit, onDelete, onDesativar, onReativar,
}: PacienteConvenioGroupProps) {
  const ativos = lista.filter(p => p.status === 'ativo').length
  const inativos = lista.filter(p => p.status === 'inativo').length

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-t-[var(--radius-lg)] bg-[var(--color-surface-1)] border border-[var(--color-border)] border-b-0 hover:bg-[var(--color-surface-2)]/50 transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={16} className="text-[var(--color-text-muted)]" />}
        <span className="text-sm font-semibold text-[var(--color-accent)]">{convenio}</span>
        <span className="text-xs text-[var(--color-text-muted)] ml-1">({lista.length})</span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {ativos} ativos{inativos > 0 ? ` · ${inativos} inativos` : ''}
        </span>
      </button>

      {expanded && (
        <div className="border border-[var(--color-border)] border-t-0 rounded-b-[var(--radius-lg)] overflow-hidden divide-y divide-white/5">
          {lista.map((p, i) => (
            <PacienteListItem
              key={p.id}
              paciente={p}
              index={i}
              onEdit={onEdit}
              onDelete={onDelete}
              onDesativar={onDesativar}
              onReativar={onReativar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

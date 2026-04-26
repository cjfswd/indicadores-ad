import { Edit3, Trash2, UserX, UserCheck } from 'lucide-react'
import { clsx } from 'clsx'

export interface PacienteLocal {
  id: string
  nome: string
  convenio: string
  modalidade: 'AD' | 'ID'
  data_nascimento: string | null
  observacoes: string | null
  status: 'ativo' | 'inativo' | 'excluido'
  motivo_desativacao: string | null
  indicador_desativacao: string | null
}

interface PacienteListItemProps {
  paciente: PacienteLocal
  index: number
  onEdit: (p: PacienteLocal) => void
  onDelete: (id: string) => void
  onDesativar: (id: string) => void
  onReativar: (id: string) => void
}

function calcularIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export function PacienteListItem({ paciente: p, index, onEdit, onDelete, onDesativar, onReativar }: PacienteListItemProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between px-4 py-3 animate-slide-in hover:bg-[var(--overlay-soft)] transition-colors',
        p.status !== 'ativo' && 'opacity-50',
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-xs font-bold text-[var(--color-accent)] flex-shrink-0">
          {p.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{p.nome}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={clsx(
              'px-1.5 py-0 rounded text-[10px] font-semibold',
              p.modalidade === 'ID' ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400',
            )}>
              {p.modalidade}
            </span>
            {p.data_nascimento && (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {calcularIdade(p.data_nascimento)} anos
              </span>
            )}
            <span className={clsx(
              'text-[10px] font-medium',
              p.status === 'ativo' ? 'text-emerald-400' : 'text-red-400',
            )}
              title={p.status !== 'ativo' && p.motivo_desativacao ? `Motivo: ${p.motivo_desativacao}${p.indicador_desativacao ? ` (Ind. ${p.indicador_desativacao})` : ''}` : undefined}
            >
              {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
            {p.status !== 'ativo' && p.motivo_desativacao && (
              <span className="text-[10px] text-red-400/60 truncate max-w-[120px]" title={p.motivo_desativacao}>
                {p.motivo_desativacao}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        {p.status === 'ativo' ? (
          <button onClick={() => onDesativar(p.id)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Desativar">
            <UserX size={14} />
          </button>
        ) : (
          <button onClick={() => onReativar(p.id)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Reativar">
            <UserCheck size={14} />
          </button>
        )}
        <button onClick={() => onEdit(p)}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--overlay-soft)] transition-colors"
          title="Editar">
          <Edit3 size={14} />
        </button>
        <button onClick={() => onDelete(p.id)}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Excluir">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

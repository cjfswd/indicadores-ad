import { Calendar, Trash2, Paperclip, ExternalLink } from 'lucide-react'

export interface EventoRegistrado {
  id: string
  paciente_id: string
  paciente_nome: string
  paciente_convenio: string
  tipo_evento: string
  descricao: string | null
  data_evento: string
  criado_em: string
  documentacao_url?: string
}

interface EventoItemProps {
  evento: EventoRegistrado
  index: number
  locked: boolean
  onDelete: (id: string) => void
}

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function EventoItem({ evento: ev, index, locked, onDelete }: EventoItemProps) {
  const docUrl = (ev as Record<string, unknown>).documentacao_url as string | undefined

  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--overlay-soft)] border border-[var(--overlay-border)] group animate-slide-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="mt-1 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{ev.paciente_nome}</span>
          <span className="text-[10px] px-1.5 py-0 rounded bg-blue-500/10 text-blue-400 font-semibold">{ev.paciente_convenio}</span>
        </div>
        {ev.descricao && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{ev.descricao}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Calendar size={10} className="text-[var(--color-text-muted)]" />
          <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(ev.data_evento)}</span>
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
              <Paperclip size={10} /> Anexo <ExternalLink size={8} />
            </a>
          )}
        </div>
      </div>

      {!locked && (
        <button onClick={() => onDelete(ev.id)}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-surface-3)] sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
          title="Remover evento (decrementa)">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { EventoItem, type EventoRegistrado } from './EventoItem'

interface CampoConfig {
  key: string
  label: string
  tipoEvento: string
}

interface GrupoConfig {
  codigo: string
  titulo: string
  campos: readonly CampoConfig[]
}

interface RegistroGrupoCardProps {
  grupo: GrupoConfig
  index: number
  collapsed: boolean
  locked: boolean
  valores: Record<string, number>
  onToggle: () => void
  onRegistrar: (tipoEvento: string, label: string) => void
  onDeleteEvento: (id: string) => void
  eventosPorTipo: (tipo: string) => EventoRegistrado[]
}

export function RegistroGrupoCard({
  grupo, index, collapsed, locked, valores,
  onToggle, onRegistrar, onDeleteEvento, eventosPorTipo,
}: RegistroGrupoCardProps) {
  return (
    <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 sm:px-5 py-3.5 hover:bg-[var(--overlay-soft)] transition-colors">
        {collapsed
          ? <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
        <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--overlay-soft)] px-2 py-0.5 rounded">{grupo.codigo}</span>
        <span className="text-sm font-semibold text-[var(--color-accent)]">{grupo.titulo}</span>
      </button>

      {!collapsed && (
        <div className="border-t border-[var(--overlay-border)]">
          {grupo.campos.map((campo, ci) => {
            const val = valores[campo.key] ?? 0
            const evts = eventosPorTipo(campo.tipoEvento)

            return (
              <div key={campo.key} className={clsx(ci > 0 && 'border-t border-[var(--overlay-border)]')}>
                <div className="flex items-center justify-between px-3 sm:px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{campo.label}</span>
                    <span className={clsx(
                      'text-lg font-bold tabular-nums',
                      val > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-surface-3)]',
                    )}>{val}</span>
                  </div>
                  {!locked && (
                    <button onClick={() => onRegistrar(campo.tipoEvento, campo.label)}
                      className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-[var(--radius-md)] text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all border border-emerald-500/20">
                      <Plus size={10} className="sm:hidden" /><Plus size={12} className="hidden sm:inline" /> <span className="hidden sm:inline">Registrar</span>
                    </button>
                  )}
                </div>

                {evts.length > 0 && (
                  <div className="px-3 sm:px-5 pb-3 space-y-1.5">
                    {evts.map((ev, ei) => (
                      <EventoItem key={ev.id} evento={ev} index={ei} locked={locked} onDelete={onDeleteEvento} />
                    ))}
                  </div>
                )}

                {evts.length === 0 && (
                  <div className="px-3 sm:px-5 pb-3">
                    <p className="text-[11px] text-[var(--color-surface-3)] italic">Nenhum evento registrado</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

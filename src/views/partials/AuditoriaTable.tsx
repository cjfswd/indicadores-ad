import type { FC } from 'hono/jsx'
import { ACAO_COLORS, ENTIDADE_LABELS, getAuditDescription, canRevert, renderAuditPayload, fmtTs } from '../helpers.js'
import { Undo2, Paperclip, ChevronLeft, ChevronRight } from '../components/Icons.js'
import { CARD, BTN_SM, BADGE } from '../ui.js'

interface AuditEntry {
  id: string; entidade: string; entidade_id: string; acao: string
  campo_alterado: string | null; valor_anterior: string | null; valor_novo: string | null
  usuario_email: string | null; justificativa: string | null
  documentacao_url: string | null; payload: string | null
  timestamp: string; revertido: boolean; reverte_ref: string | null
}

export interface AuditoriaTableProps {
  logs: AuditEntry[]
  pagina: number
  totalPaginas: number
}

const ACAO_DOT: Record<string, string> = {
  criar: 'bg-emerald-500', editar: 'bg-amber-500', confirmar: 'bg-blue-500',
  excluir: 'bg-red-500', reverter: 'bg-orange-500', desativar: 'bg-amber-500',
  reativar: 'bg-teal-500', reverter_criacao: 'bg-orange-500', reverter_exclusao: 'bg-cyan-500',
  reverter_edicao: 'bg-violet-500', reverter_confirmacao: 'bg-sky-500',
  reverter_desativacao: 'bg-teal-500', reverter_reativacao: 'bg-amber-500',
}

const ACAO_STYLES: Record<string, string> = {
  criar: 'bg-emerald-500/15 text-emerald-400', editar: 'bg-amber-500/15 text-amber-400',
  confirmar: 'bg-blue-500/15 text-blue-400', excluir: 'bg-red-500/15 text-red-400',
  reverter: 'bg-orange-500/15 text-orange-400', desativar: 'bg-amber-500/15 text-amber-400',
  reativar: 'bg-teal-500/15 text-teal-400', reverter_criacao: 'bg-orange-500/15 text-orange-400',
  reverter_exclusao: 'bg-cyan-500/15 text-cyan-400', reverter_edicao: 'bg-violet-500/15 text-violet-400',
  reverter_confirmacao: 'bg-sky-500/15 text-sky-400',
  reverter_desativacao: 'bg-teal-500/15 text-teal-400',
  reverter_reativacao: 'bg-amber-500/15 text-amber-400',
}

export const AuditoriaTable: FC<AuditoriaTableProps> = ({ logs, pagina, totalPaginas }) => {
  if (logs.length === 0) {
    return (
      <div class="text-center py-16 text-(--color-text-muted)">
        <p class="text-sm">Nenhum registro de auditoria encontrado</p>
      </div>
    )
  }
  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-3">
        {logs.map((entry, i) => {
          const acaoStyle = ACAO_STYLES[entry.acao] ?? 'bg-gray-500/15 text-gray-400'
          const dotStyle = ACAO_DOT[entry.acao] ?? 'bg-gray-500'
          return (
            <div class={CARD} style={`animation:fadeIn .3s ease ${i * 40}ms both`}>
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class={`w-2 h-2 rounded-full shrink-0 ${dotStyle}`}></span>
                <span class={`inline-block px-2 py-0.5 rounded-full text-[.6875rem] font-semibold uppercase ${acaoStyle}`}>{entry.acao}</span>
                <span class={BADGE}>{ENTIDADE_LABELS[entry.entidade] ?? entry.entidade}</span>
                {entry.revertido && <span class="text-[.625rem] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">REVERTIDO</span>}
                {entry.reverte_ref && <span class="text-[.625rem] font-medium text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">REVERSÃO</span>}
                {entry.usuario_email && <span class="text-[.625rem] text-(--color-accent) font-medium max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap" title={entry.usuario_email}>{entry.usuario_email}</span>}
                <span class="ml-auto text-[.6875rem] text-(--color-text-muted) tabular-nums">{fmtTs(entry.timestamp)}</span>
              </div>
              <p class="text-sm text-(--color-text-secondary)">{getAuditDescription(entry)}</p>
              {entry.justificativa && <p class="text-[.6875rem] text-(--color-text-muted) mt-1.5 italic">"{entry.justificativa}"</p>}
              {entry.documentacao_url && (
                <a href={entry.documentacao_url} target="_blank" download class="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg text-[.6875rem] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 no-underline">
                  <Paperclip size={12} /> {entry.documentacao_url.split('/').pop()}
                </a>
              )}
              <details class="audit-details mt-2 border border-[var(--overlay-border)] rounded-lg overflow-hidden">
                <summary class="flex items-center gap-2 py-2 px-3 text-xs font-medium text-(--color-text-muted) cursor-pointer bg-slate-800/40 hover:bg-slate-600/30 hover:text-(--color-text-secondary) transition-all duration-150 select-none">Detalhes da operação</summary>
                <div class="p-3 text-[.6875rem] font-mono bg-(--color-surface-0) text-(--color-text-muted) max-h-[250px] overflow-auto whitespace-pre-wrap break-all leading-relaxed border-t border-[var(--overlay-border)]"><pre>{renderAuditPayload(entry)}</pre></div>
              </details>
              {canRevert(entry) && (
                <div class="mt-3 pt-2 border-t border-[var(--overlay-border)]">
                  <button class={`${BTN_SM} bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs`} hx-get={`/auditoria/${entry.id}/modal/reverter`} hx-target="#modal-container" hx-swap="innerHTML">
                    <Undo2 size={14} /> Reverter
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {totalPaginas > 1 && (
        <div class="flex items-center justify-center gap-4">
          <button class={`${BTN_SM} bg-(--color-surface-2) text-(--color-text-primary) border-(--color-border)`} disabled={pagina <= 1} hx-get={`/auditoria/content?pagina=${pagina - 1}`} hx-target="#auditoria-content" hx-include="[name='filtroEntidade'],[name='filtroAcao']">
            <ChevronLeft size={14} />
          </button>
          <span class="text-sm text-(--color-text-muted) tabular-nums">Página <strong class="text-(--color-text-primary)">{pagina}</strong> de {totalPaginas}</span>
          <button class={`${BTN_SM} bg-(--color-surface-2) text-(--color-text-primary) border-(--color-border)`} disabled={pagina >= totalPaginas} hx-get={`/auditoria/content?pagina=${pagina + 1}`} hx-target="#auditoria-content" hx-include="[name='filtroEntidade'],[name='filtroAcao']">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

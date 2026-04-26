import type { FC } from 'hono/jsx'
import { ACAO_COLORS, ENTIDADE_LABELS, getAuditDescription, canRevert, renderAuditPayload, fmtTs } from '../helpers.js'

interface AuditEntry {
  id: string; entidade: string; entidade_id: string; acao: string
  campo_alterado: string | null; valor_anterior: string | null; valor_novo: string | null
  usuario_email: string | null; justificativa: string | null
  documentacao_url: string | null; payload: string | null
  timestamp: string; revertido: boolean; reverte_ref: string | null
}

interface AuditoriaTableProps {
  logs: AuditEntry[]
  pagina: number
  totalPaginas: number
}

export const AuditoriaTable: FC<AuditoriaTableProps> = ({ logs, pagina, totalPaginas }) => {
  if (logs.length === 0) {
    return (
      <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">
        <p style="font-size:.875rem">Nenhum registro de auditoria encontrado</p>
      </div>
    )
  }
  return (
    <>
      <div class="space-y-3">
        {logs.map((entry, i) => {
          const acaoColor = ACAO_COLORS[entry.acao] ?? { bg: 'rgba(107,114,128,.15)', text: '#9ca3af' }
          return (
            <div class="glass-card no-hover" style={`padding:1rem;animation:fadeIn .3s ease ${i * 40}ms both`}>
              <div class="flex items-center gap-2" style="margin-bottom:.5rem;flex-wrap:wrap">
                <span style={`display:inline-block;padding:.125rem .5rem;border-radius:9999px;font-size:.6875rem;font-weight:600;text-transform:uppercase;background:${acaoColor.bg};color:${acaoColor.text}`}>{entry.acao}</span>
                <span class="badge badge-muted">{ENTIDADE_LABELS[entry.entidade] ?? entry.entidade}</span>
                {entry.revertido && <span style="font-size:.625rem;font-weight:500;color:#fb7185;background:rgba(244,63,94,.1);padding:.125rem .375rem;border-radius:.25rem;border:1px solid rgba(244,63,94,.2)">REVERTIDO</span>}
                {entry.reverte_ref && <span style="font-size:.625rem;font-weight:500;color:#a78bfa;background:rgba(139,92,246,.1);padding:.125rem .375rem;border-radius:.25rem;border:1px solid rgba(139,92,246,.2)">REVERSÃO</span>}
                {entry.usuario_email && <span style="font-size:.625rem;color:var(--color-accent);font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title={entry.usuario_email}>{entry.usuario_email}</span>}
                <span style="margin-left:auto;font-size:.6875rem;color:var(--color-text-muted);font-variant-numeric:tabular-nums">{fmtTs(entry.timestamp)}</span>
              </div>
              <p style="font-size:.875rem;color:var(--color-text-secondary)">{getAuditDescription(entry)}</p>
              {entry.justificativa && <p style="font-size:.6875rem;color:var(--color-text-muted);margin-top:.375rem;font-style:italic">"{entry.justificativa}"</p>}
              {entry.documentacao_url && (
                <a href={entry.documentacao_url} target="_blank" download style="display:inline-flex;align-items:center;gap:.375rem;margin-top:.375rem;padding:.25rem .625rem;border-radius:var(--radius-md);font-size:.6875rem;font-weight:500;color:#60a5fa;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);text-decoration:none">📎 {entry.documentacao_url.split('/').pop()}</a>
              )}
              <details class="audit-details">
                <summary>Detalhes da operação</summary>
                <div class="audit-payload"><pre>{renderAuditPayload(entry)}</pre></div>
              </details>
              {canRevert(entry) && (
                <div style="margin-top:.75rem;padding-top:.5rem;border-top:1px solid var(--overlay-border)">
                  <button class="btn btn-sm" style="background:rgba(245,158,11,.1);color:#fbbf24;border:1px solid rgba(245,158,11,.2);font-size:.75rem" hx-get={`/auditoria/${entry.id}/modal/reverter`} hx-target="#modal-container" hx-swap="innerHTML">↺ Reverter</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {totalPaginas > 1 && (
        <div class="flex items-center" style="justify-content:center;gap:1rem;margin-top:1rem">
          <button class="btn btn-secondary btn-sm" disabled={pagina <= 1} hx-get={`/auditoria/content?pagina=${pagina - 1}`} hx-target="#auditoria-content" hx-include="[name='filtroEntidade'],[name='filtroAcao']">‹</button>
          <span style="font-size:.875rem;color:var(--color-text-muted);font-variant-numeric:tabular-nums">Página <strong style="color:var(--color-text-primary)">{pagina}</strong> de {totalPaginas}</span>
          <button class="btn btn-secondary btn-sm" disabled={pagina >= totalPaginas} hx-get={`/auditoria/content?pagina=${pagina + 1}`} hx-target="#auditoria-content" hx-include="[name='filtroEntidade'],[name='filtroAcao']">›</button>
        </div>
      )}
    </>
  )
}

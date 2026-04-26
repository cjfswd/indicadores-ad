import { RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import { FileDownloadLink } from '@/components/FileDownloadLink'
import {
  type AuditEntry, ACAO_STYLES, ENTIDADE_LABELS,
  formatTimestamp, getDescription,
  canRevert, canReRegister, canRevertEdit, canRevertConfirm, canRevertReativar,
} from '@/lib/audit-helpers'

export type { AuditEntry }

interface AuditEntryCardProps {
  entry: AuditEntry
  index: number
  onRevert: (entry: AuditEntry) => void
}

export function AuditEntryCard({ entry, index, onRevert }: AuditEntryCardProps) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="glass-card p-4 group">
        {/* Header badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase',
            ACAO_STYLES[entry.acao] ?? 'bg-gray-500/15 text-gray-400')}>
            {entry.acao}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--overlay-soft)] text-[var(--color-text-muted)] font-medium">
            {ENTIDADE_LABELS[entry.entidade] ?? entry.entidade}
          </span>
          {entry.revertido ? (
            <span className="text-[10px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              REVERTIDO
            </span>
          ) : null}
          {entry.reverte_ref && (
            <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
              REVERSÃO
            </span>
          )}
          {entry.usuario_email && (
            <span className="text-[10px] text-[var(--color-accent)] font-medium truncate max-w-[220px]" title={entry.usuario_email}>
              {entry.usuario_email}
            </span>
          )}
          <span className="ml-auto text-[11px] text-[var(--color-text-muted)] tabular-nums">
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--color-text-secondary)]">{getDescription(entry)}</p>

        {entry.justificativa && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 italic">"{entry.justificativa}"</p>
        )}

        {entry.documentacao_url && (
          <div className="mt-1.5">
            <FileDownloadLink url={entry.documentacao_url} />
          </div>
        )}

        {/* Details panel */}
        <AuditDetailsPanel entry={entry} />

        {/* Revert actions */}
        {!entry.revertido && (canRevert(entry) || canReRegister(entry) || canRevertEdit(entry) || canRevertConfirm(entry) || canRevertReativar(entry)) && (
          <div className="mt-3 pt-2 border-t border-[var(--overlay-border)] flex gap-2 flex-wrap">
            {canRevert(entry) && (
              <RevertButton label="Reverter criação" color="amber" onClick={() => onRevert(entry)} />
            )}
            {canReRegister(entry) && (
              <RevertButton label={`Reverter ${entry.acao === 'desativar' ? '(reativar)' : '(re-registrar)'}`} color="emerald" onClick={() => onRevert(entry)} />
            )}
            {canRevertConfirm(entry) && (
              <RevertButton label="Reverter confirmação" color="sky" onClick={() => onRevert(entry)} />
            )}
            {canRevertEdit(entry) && (
              <RevertButton label="Reverter edição" color="violet" onClick={() => onRevert(entry)} />
            )}
            {canRevertReativar(entry) && (
              <RevertButton label="Reverter reativação" color="amber" onClick={() => onRevert(entry)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──

function RevertButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-${color}-400 bg-${color}-500/10 hover:bg-${color}-500/20 transition-colors border border-${color}-500/20`}>
      <RotateCcw size={12} /> {label}
    </button>
  )
}

function AuditDetailsPanel({ entry }: { entry: AuditEntry }) {
  const parsed = entry.payload ? (() => { try { return JSON.parse(entry.payload!) } catch { return null } })() : null
  const hasDiff = parsed && parsed.antes !== undefined && parsed.depois !== undefined

  return (
    <details className="mt-2 group">
      <summary className="text-[10px] text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors select-none">
        📋 Detalhes da operação
      </summary>
      <div className="mt-1.5 text-[10px] bg-[var(--color-surface-0)] rounded-[var(--radius-md)] border border-[var(--overlay-border)] overflow-hidden">
        {hasDiff ? <DiffView antes={parsed.antes ?? {}} depois={parsed.depois ?? {}} /> : <PropView entry={entry} parsed={parsed} />}
      </div>
    </details>
  )
}

function DiffView({ antes, depois }: { antes: Record<string, unknown>; depois: Record<string, unknown> }) {
  const allKeys = [...new Set([...Object.keys(antes), ...Object.keys(depois)])].filter(k => !['criado_em', 'atualizado_em'].includes(k))
  const changed = allKeys.filter(k => JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
  const unchanged = allKeys.filter(k => JSON.stringify(antes[k]) === JSON.stringify(depois[k]))

  return (
    <div className="divide-y divide-[var(--overlay-border)]">
      {changed.length > 0 && (
        <div className="p-2.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 block">Alterações</span>
          {changed.map(k => (
            <div key={k} className="flex items-start gap-2 py-0.5 font-mono">
              <span className="text-[var(--color-text-muted)] w-32 shrink-0 truncate" title={k}>{k}</span>
              <div className="flex flex-col gap-0.5 min-w-0">
                {antes[k] !== undefined && <span className="text-rose-400 bg-rose-500/5 px-1 rounded">- {JSON.stringify(antes[k])}</span>}
                {depois[k] !== undefined && <span className="text-emerald-400 bg-emerald-500/5 px-1 rounded">+ {JSON.stringify(depois[k])}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {unchanged.length > 0 && (
        <details className="p-2.5">
          <summary className="text-[9px] text-[var(--color-text-muted)] cursor-pointer select-none">{unchanged.length} campo(s) inalterado(s)</summary>
          <div className="mt-1 space-y-0.5 font-mono text-[var(--color-text-muted)]">
            {unchanged.map(k => (
              <div key={k} className="flex gap-2 py-0.5">
                <span className="w-32 shrink-0 truncate" title={k}>{k}</span>
                <span className="opacity-60">{JSON.stringify(antes[k])}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function PropView({ entry, parsed }: { entry: AuditEntry; parsed: Record<string, unknown> | null }) {
  const data = parsed ?? Object.fromEntries(
    Object.entries({
      id: entry.id, entidade: entry.entidade, entidade_id: entry.entidade_id,
      acao: entry.acao, campo_alterado: entry.campo_alterado,
      valor_anterior: entry.valor_anterior, valor_novo: entry.valor_novo,
      justificativa: entry.justificativa, documentacao_url: entry.documentacao_url,
      reverte_ref: entry.reverte_ref,
    }).filter(([, v]) => v != null)
  )
  const entries = Object.entries(data).filter(([, v]) => v != null)

  return (
    <div className="p-2.5 space-y-0.5 font-mono text-[var(--color-text-muted)]">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 py-0.5">
          <span className="w-32 shrink-0 truncate text-[var(--color-text-secondary)]" title={k}>{k}</span>
          <span className="break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
        </div>
      ))}
    </div>
  )
}

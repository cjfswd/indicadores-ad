import { esc, when, fmtTs } from './html.js'

interface AuditEntry {
  id: string
  entidade: string
  entidade_id: string
  acao: string
  usuario_email: string | null
  justificativa: string | null
  valor_anterior: string | null
  valor_novo: string | null
  campo_alterado: string | null
  payload: string | null
  documentacao_url: string | null
  revertido: boolean | null
  reverte_ref: string | null
  timestamp: unknown
}

interface AuditoriaTableProps {
  logs: AuditEntry[]
  total: number
  pagina: number
  totalPaginas: number
}

const ACAO_COLORS: Record<string, { bg: string; text: string }> = {
  criar: { bg: 'rgba(16,185,129,.15)', text: '#34d399' },
  editar: { bg: 'rgba(245,158,11,.15)', text: '#fbbf24' },
  confirmar: { bg: 'rgba(59,130,246,.15)', text: '#60a5fa' },
  excluir: { bg: 'rgba(239,68,68,.15)', text: '#f87171' },
  desativar: { bg: 'rgba(245,158,11,.15)', text: '#fbbf24' },
  reativar: { bg: 'rgba(20,184,166,.15)', text: '#2dd4bf' },
  reverter_criacao: { bg: 'rgba(249,115,22,.15)', text: '#fb923c' },
  reverter_exclusao: { bg: 'rgba(6,182,212,.15)', text: '#22d3ee' },
  reverter_edicao: { bg: 'rgba(139,92,246,.15)', text: '#a78bfa' },
  reverter_confirmacao: { bg: 'rgba(56,189,248,.15)', text: '#38bdf8' },
  reverter_desativacao: { bg: 'rgba(20,184,166,.15)', text: '#2dd4bf' },
  reverter_reativacao: { bg: 'rgba(245,158,11,.15)', text: '#fbbf24' },
}

const ENTIDADE_LABELS: Record<string, string> = {
  evento_paciente: 'Evento Clínico', registro_mensal: 'Registro Mensal',
  paciente: 'Paciente', meta: 'Meta',
}

const INDICADOR_LABELS: Record<string, string> = {
  '01': 'Taxa de Altas (%)', '02': 'Intercorrências', '03': 'Taxa Internação (%)', '04': 'Óbitos',
  '05': 'Alteração PAD (%)', '06': 'Censo AD/ID', '07': 'Infectados', '08': 'Eventos Adversos', '09': 'Reclamações',
}

const TIPO_EVENTO_LABELS: Record<string, string> = {
  alta: 'Alta', intercorrencia: 'Intercorrência',
  intern_deterioracao: 'Internação (deterioração)', intern_nao_aderencia: 'Internação (não aderência)',
  obito: 'Óbito', obito_menos_48h: 'Óbito <48h', obito_mais_48h: 'Óbito ≥48h',
  infectado: 'Infecção', ea_queda: 'EA: Queda', ea_broncoaspiracao: 'EA: Broncoaspiração',
  ea_lesao_pressao: 'EA: Lesão Pressão', ea_decanulacao: 'EA: Decanulação', ea_saida_gtt: 'EA: Saída GTT',
  evento_adverso: 'Evento Adverso', ouvidoria_elogio: 'Ouvidoria: Elogio',
  ouvidoria_sugestao: 'Ouvidoria: Sugestão', ouvidoria_reclamacao: 'Ouvidoria: Reclamação',
}

const MESES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getDescription(entry: AuditEntry): string {
  let payload: Record<string, unknown> | null = null
  try { if (entry.payload) payload = JSON.parse(entry.payload) } catch { /* ignore */ }

  const tipo = entry.campo_alterado ? (TIPO_EVENTO_LABELS[entry.campo_alterado] ?? entry.campo_alterado) : null
  const nome = (() => {
    try {
      const p = payload as Record<string, Record<string, string>> | null
      return p?.antes?.nome ?? p?.depois?.nome ?? (payload as Record<string, string>)?.nome ?? entry.valor_anterior ?? entry.valor_novo
    } catch { return entry.valor_novo }
  })()
  const indicador = INDICADOR_LABELS[entry.entidade_id] ?? entry.entidade_id

  if (entry.entidade === 'evento_paciente') {
    if (entry.acao === 'criar') return `Registrou ${tipo ?? 'evento'} — paciente ${entry.valor_novo ?? ''}`
    if (entry.acao === 'excluir') return `Reverteu ${tipo ?? 'evento'} — paciente ${entry.valor_novo ?? ''}`
  }
  if (entry.entidade === 'registro_mensal') {
    let periodo = ''
    try {
      const p = payload as Record<string, Record<string, number>> | null
      const a = p?.antes?.ano ?? p?.depois?.ano
      const m = p?.antes?.mes ?? p?.depois?.mes
      if (a && m) periodo = ` (${MESES[m]}/${a})`
    } catch { /* ignore */ }
    if (entry.acao === 'confirmar') return `Confirmou registro mensal${periodo}`
    if (entry.acao === 'reverter_confirmacao') return `Reverteu confirmação de registro mensal${periodo}`
    if (entry.acao === 'criar') return `Criou registro mensal${periodo}`
  }
  if (entry.entidade === 'paciente') {
    if (entry.acao === 'criar') return `Cadastrou paciente ${nome ?? ''}`
    if (entry.acao === 'editar') return `Editou paciente ${nome ?? ''}`
    if (entry.acao === 'desativar') return `Desativou paciente ${nome ?? ''}`
    if (entry.acao === 'reativar') return `Reativou paciente ${nome ?? ''}`
    if (entry.acao === 'excluir') return `Excluiu paciente ${nome ?? ''}`
    if (entry.acao.startsWith('reverter')) return `Reverteu ${entry.acao.split('_').slice(1).join(' ')} de paciente ${nome ?? ''}`
  }
  if (entry.entidade === 'meta') {
    if (entry.acao === 'criar') return `Definiu meta de ${indicador}`
    if (entry.acao === 'editar') return `Alterou meta de ${indicador}`
  }
  return `${entry.acao} ${ENTIDADE_LABELS[entry.entidade] ?? entry.entidade}`
}

function canRevert(e: AuditEntry): boolean {
  return !e.revertido && ['criar', 'editar', 'confirmar', 'desativar', 'reativar', 'excluir'].includes(e.acao)
}

function renderPayload(entry: AuditEntry): string {
  try {
    const p = entry.payload ? JSON.parse(entry.payload) : { id: entry.id, entidade: entry.entidade, acao: entry.acao }
    return esc(JSON.stringify(p, null, 2))
  } catch { return esc(entry.payload ?? 'N/A') }
}

function renderAuditCard(entry: AuditEntry, i: number): string {
  const acaoColor = ACAO_COLORS[entry.acao] ?? { bg: 'rgba(107,114,128,.15)', text: '#9ca3af' }

  return `<div class="glass-card no-hover" style="padding:1rem;animation:fadeIn .3s ease ${i * 40}ms both">
    <div class="flex items-center gap-2" style="margin-bottom:.5rem;flex-wrap:wrap">
      <span style="display:inline-block;padding:.125rem .5rem;border-radius:9999px;font-size:.6875rem;font-weight:600;text-transform:uppercase;background:${acaoColor.bg};color:${acaoColor.text}">${esc(entry.acao)}</span>
      <span class="badge badge-muted">${esc(ENTIDADE_LABELS[entry.entidade] ?? entry.entidade)}</span>
      ${when(entry.revertido, '<span style="font-size:.625rem;font-weight:500;color:#fb7185;background:rgba(244,63,94,.1);padding:.125rem .375rem;border-radius:.25rem;border:1px solid rgba(244,63,94,.2)">REVERTIDO</span>')}
      ${when(entry.reverte_ref, '<span style="font-size:.625rem;font-weight:500;color:#a78bfa;background:rgba(139,92,246,.1);padding:.125rem .375rem;border-radius:.25rem;border:1px solid rgba(139,92,246,.2)">REVERSÃO</span>')}
      ${when(entry.usuario_email, `<span style="font-size:.625rem;color:var(--color-accent);font-weight:500;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(entry.usuario_email)}">${esc(entry.usuario_email)}</span>`)}
      <span style="margin-left:auto;font-size:.6875rem;color:var(--color-text-muted);font-variant-numeric:tabular-nums">${fmtTs(entry.timestamp)}</span>
    </div>
    <p style="font-size:.875rem;color:var(--color-text-secondary)">${esc(getDescription(entry))}</p>
    ${when(entry.justificativa, `<p style="font-size:.6875rem;color:var(--color-text-muted);margin-top:.375rem;font-style:italic">"${esc(entry.justificativa)}"</p>`)}
    ${when(entry.documentacao_url, `<a href="${esc(entry.documentacao_url)}" target="_blank" download style="display:inline-flex;align-items:center;gap:.375rem;margin-top:.375rem;padding:.25rem .625rem;border-radius:var(--radius-md);font-size:.6875rem;font-weight:500;color:#60a5fa;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);text-decoration:none">📎 ${esc(entry.documentacao_url?.split('/').pop())}</a>`)}
    <details class="audit-details">
      <summary>Detalhes da operação</summary>
      <div class="audit-payload">${renderPayload(entry)}</div>
    </details>
    ${when(canRevert(entry), `<div style="margin-top:.75rem;padding-top:.5rem;border-top:1px solid var(--overlay-border)">
      <button class="btn btn-sm" style="background:rgba(245,158,11,.1);color:#fbbf24;border:1px solid rgba(245,158,11,.2);font-size:.75rem" hx-get="/auditoria/${entry.id}/modal/reverter" hx-target="#modal-container" hx-swap="innerHTML">↺ Reverter</button>
    </div>`)}
  </div>`
}

function renderPagination(pagina: number, totalPaginas: number): string {
  if (totalPaginas <= 1) return ''
  return `<div class="flex items-center" style="justify-content:center;gap:1rem;margin-top:1rem">
    <button class="btn btn-secondary btn-sm" ${pagina <= 1 ? 'disabled' : ''} hx-get="/auditoria/content?pagina=${pagina - 1}" hx-target="#auditoria-content" hx-include="[name='filtroEntidade'],[name='filtroAcao']">‹</button>
    <span style="font-size:.875rem;color:var(--color-text-muted);font-variant-numeric:tabular-nums">Página <strong style="color:var(--color-text-primary)">${pagina}</strong> de ${totalPaginas}</span>
    <button class="btn btn-secondary btn-sm" ${pagina >= totalPaginas ? 'disabled' : ''} hx-get="/auditoria/content?pagina=${pagina + 1}" hx-target="#auditoria-content" hx-include="[name='filtroEntidade'],[name='filtroAcao']">›</button>
  </div>`
}

export function renderAuditoriaTable({ logs, pagina, totalPaginas }: AuditoriaTableProps): string {
  if (logs.length === 0) {
    return `<div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto .75rem;opacity:.3"><path d="M3 3v5h5"/><path d="M3 8a9 9 0 0 1 18 0 9 9 0 0 1-18 0"/></svg>
      <p style="font-size:.875rem">Nenhum registro de auditoria encontrado</p>
    </div>`
  }

  return `<div class="space-y-3">${logs.map((entry, i) => renderAuditCard(entry, i)).join('')}</div>${renderPagination(pagina, totalPaginas)}`
}

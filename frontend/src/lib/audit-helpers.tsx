import type { ReactNode } from 'react'

// ── Types ──

export interface AuditEntry {
  id: string
  entidade: string
  entidade_id: string
  acao: string
  campo_alterado: string | null
  valor_anterior: string | null
  valor_novo: string | null
  usuario_email: string | null
  timestamp: string
  justificativa: string | null
  documentacao_url: string | null
  payload: string | null
  revertido: number
  revertido_por: string | null
  reverte_ref: string | null
}

// ── Style Maps ──

export const ACAO_STYLES: Record<string, string> = {
  criar: 'bg-emerald-500/15 text-emerald-400',
  editar: 'bg-amber-500/15 text-amber-400',
  confirmar: 'bg-blue-500/15 text-blue-400',
  excluir: 'bg-red-500/15 text-red-400',
  reverter: 'bg-orange-500/15 text-orange-400',
  reverter_criacao: 'bg-orange-500/15 text-orange-400',
  reverter_exclusao: 'bg-cyan-500/15 text-cyan-400',
  reverter_edicao: 'bg-violet-500/15 text-violet-400',
  reverter_confirmacao: 'bg-sky-500/15 text-sky-400',
  desativar: 'bg-amber-500/15 text-amber-400',
  reativar: 'bg-teal-500/15 text-teal-400',
  reverter_desativacao: 'bg-teal-500/15 text-teal-400',
  reverter_reativacao: 'bg-amber-500/15 text-amber-400',
}

export const ENTIDADE_LABELS: Record<string, string> = {
  evento_paciente: 'Evento Clínico',
  registro_mensal: 'Registro Mensal',
  paciente: 'Paciente',
  meta: 'Meta',
}

export const TIPO_EVENTO_LABELS: Record<string, string> = {
  intercorrencia: 'Intercorrência', intercorr_removida_dom: 'Intercorr. Domicílio',
  intercorr_necessidade_rem: 'Intercorr. Remoção', intern_deterioracao: 'Internação (deterioração)',
  intern_nao_aderencia: 'Internação (não aderência)', obito: 'Óbito',
  obito_menos_48h: 'Óbito <48h', obito_mais_48h: 'Óbito ≥48h',
  infectado: 'Infecção', ea_queda: 'EA: Queda', ea_broncoaspiracao: 'EA: Broncoaspiração',
  ea_lesao_pressao: 'EA: Lesão Pressão', ea_decanulacao: 'EA: Decanulação',
  ea_saida_gtt: 'EA: Saída GTT', evento_adverso: 'Evento Adverso',
  ouvidoria_elogio: 'Ouvidoria: Elogio', ouvidoria_sugestao: 'Ouvidoria: Sugestão',
  ouvidoria_reclamacao: 'Ouvidoria: Reclamação', alta: 'Alta',
}

export const INDICADOR_LABELS: Record<string, string> = {
  '01': 'Taxa de Altas (%)', '02': 'Intercorrências', '03': 'Taxa Internação (%)',
  '04': 'Óbitos', '05': 'Alteração PAD (%)', '06': 'Censo AD/ID',
  '07': 'Infectados', '08': 'Eventos Adversos', '09': 'Reclamações',
  'IND-001': 'Taxa de Altas (%)', 'IND-002': 'Intercorrências', 'IND-003': 'Taxa Internação (%)',
  'IND-004': 'Óbitos', 'IND-005': 'Alteração PAD (%)', 'IND-006': 'Censo AD/ID',
  'IND-007': 'Infectados', 'IND-008': 'Eventos Adversos', 'IND-009': 'Reclamações',
}

// ── Utility ──

export function formatTimestamp(ts: string) {
  if (!ts) return ''
  const d = new Date(ts.replace(' ', 'T'))
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function tryParsePayload(entry: AuditEntry): Record<string, unknown> | null {
  try { return entry.payload ? JSON.parse(entry.payload) : null } catch { return null }
}

// ── Can-revert predicates ──

export const canRevert = (e: AuditEntry) => e.acao === 'criar' && !e.revertido
export const canReRegister = (e: AuditEntry) => (e.acao === 'excluir' || e.acao === 'desativar') && !e.revertido
export const canRevertEdit = (e: AuditEntry) => e.acao === 'editar' && !e.revertido && !!(e.valor_anterior || e.payload)
export const canRevertConfirm = (e: AuditEntry) => e.acao === 'confirmar' && !e.revertido
export const canRevertReativar = (e: AuditEntry) => e.acao === 'reativar' && !e.revertido
export const hasAnyRevertAction = (e: AuditEntry) =>
  !e.revertido && (canRevert(e) || canReRegister(e) || canRevertEdit(e) || canRevertConfirm(e) || canRevertReativar(e))

// ── Entity Summary (for confirm dialogs) ──

export function getEntitySummary(entry: AuditEntry): { title: string; lines: { label: string; value: string }[] } {
  const entidadeLabel = ENTIDADE_LABELS[entry.entidade] ?? entry.entidade
  const acaoLabel = entry.acao === 'criar' ? 'Reverter criação'
    : entry.acao === 'excluir' ? 'Re-registrar'
    : entry.acao === 'editar' ? 'Reverter edição'
    : entry.acao === 'confirmar' ? 'Reverter confirmação'
    : entry.acao === 'desativar' ? 'Reverter desativação (reativar)'
    : entry.acao === 'reativar' ? 'Reverter reativação (desativar)'
    : 'Reverter'
  const title = `${acaoLabel} de ${entidadeLabel}?`
  const lines: { label: string; value: string }[] = []
  const p = tryParsePayload(entry) as Record<string, unknown> | null

  if (entry.entidade === 'evento_paciente') {
    const tipo = entry.campo_alterado ? (TIPO_EVENTO_LABELS[entry.campo_alterado] ?? entry.campo_alterado) : 'Evento'
    lines.push({ label: 'Tipo', value: tipo })
    const pacNome = (p as Record<string, unknown>)?.paciente_nome ?? (p as Record<string, unknown>)?.antes?.paciente_nome ?? entry.valor_novo
    if (pacNome) lines.push({ label: 'Paciente', value: String(pacNome) })
  } else if (entry.entidade === 'paciente') {
    const nome = (p as Record<string, unknown>)?.antes?.nome ?? (p as Record<string, unknown>)?.depois?.nome ?? (p as Record<string, unknown>)?.nome ?? entry.valor_novo
    if (nome) lines.push({ label: 'Nome', value: String(nome) })
  } else if (entry.entidade === 'meta') {
    lines.push({ label: 'Indicador', value: INDICADOR_LABELS[entry.entidade_id] ?? entry.entidade_id })
    const antes = (p as Record<string, unknown>)?.antes as Record<string, unknown> | undefined
    const depois = (p as Record<string, unknown>)?.depois as Record<string, unknown> | undefined
    if (antes?.meta_valor != null) lines.push({ label: 'Meta anterior', value: String(antes.meta_valor) })
    if (depois?.meta_valor != null) lines.push({ label: 'Meta nova', value: String(depois.meta_valor) })
  } else if (entry.entidade === 'registro_mensal') {
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const ano = (p as Record<string, unknown>)?.antes?.ano ?? (p as Record<string, unknown>)?.depois?.ano ?? (p as Record<string, unknown>)?.ano
    const mes = (p as Record<string, unknown>)?.antes?.mes ?? (p as Record<string, unknown>)?.depois?.mes ?? (p as Record<string, unknown>)?.mes
    if (ano && mes) lines.push({ label: 'Período', value: `${meses[Number(mes)]} ${ano}` })
    const status = (p as Record<string, unknown>)?.antes?.status ?? (p as Record<string, unknown>)?.depois?.status
    if (status) lines.push({ label: 'Status', value: status === 'confirmado' ? 'Confirmado' : 'Rascunho' })
  }
  return { title, lines }
}

// ── Description renderer (returns JSX) ──

export function getDescription(entry: AuditEntry): ReactNode {
  const tipo = entry.campo_alterado ? (TIPO_EVENTO_LABELS[entry.campo_alterado] ?? entry.campo_alterado) : null
  const p = tryParsePayload(entry) as Record<string, unknown> | null

  if (entry.entidade === 'evento_paciente') {
    if (entry.acao === 'criar') return (<>Registrou <span className="font-semibold text-[var(--color-accent)]">{tipo}</span> — paciente <span className="font-semibold text-[var(--color-text-primary)]">{entry.valor_novo}</span></>)
    if (entry.acao === 'excluir') return (<>Reverteu <span className="font-semibold text-amber-400">{tipo}</span> — paciente <span className="font-semibold text-[var(--color-text-primary)]">{entry.valor_novo}</span></>)
  }
  if (entry.entidade === 'registro_mensal') {
    const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    let periodo = ''
    if (p) {
      const ano = (p as Record<string, unknown>)?.antes?.ano ?? (p as Record<string, unknown>)?.depois?.ano ?? (p as Record<string, unknown>)?.ano
      const mes = (p as Record<string, unknown>)?.antes?.mes ?? (p as Record<string, unknown>)?.depois?.mes ?? (p as Record<string, unknown>)?.mes
      if (ano && mes) periodo = ` (${meses[Number(mes)]}/${ano})`
    }
    if (entry.acao === 'confirmar') return (<>Confirmou <span className="font-semibold text-blue-400">registro mensal{periodo}</span></>)
    if (entry.acao === 'reverter_confirmacao') return (<>Reverteu confirmação de <span className="font-semibold text-sky-400">registro mensal{periodo}</span> — voltou para rascunho</>)
    if (entry.acao === 'criar') return (<>Criou <span className="font-semibold text-emerald-400">registro mensal{periodo}</span></>)
    if (entry.acao === 'editar') return (<>Editou <span className="font-semibold text-amber-400">registro mensal{periodo}</span></>)
  }
  if (entry.entidade === 'paciente') {
    const pacNome = (() => { try { return (p as Record<string, unknown>)?.antes?.nome ?? (p as Record<string, unknown>)?.depois?.nome ?? (p as Record<string, unknown>)?.nome ?? entry.valor_anterior ?? entry.valor_novo } catch { return entry.valor_novo } })()
    const m: Record<string, ReactNode> = {
      criar: <>Cadastrou paciente <span className="font-semibold text-[var(--color-text-primary)]">{pacNome}</span></>,
      editar: <>Editou paciente <span className="font-semibold text-[var(--color-text-primary)]">{pacNome}</span></>,
      desativar: <>Desativou paciente <span className="font-semibold text-amber-400">{pacNome}</span></>,
      reativar: <>Reativou paciente <span className="font-semibold text-teal-400">{pacNome}</span></>,
      excluir: <>Excluiu paciente <span className="font-semibold text-red-400">{pacNome}</span></>,
      reverter_criacao: <>Reverteu criação de paciente <span className="font-semibold text-orange-400">{pacNome}</span></>,
      reverter_exclusao: <>Reverteu desativação de paciente <span className="font-semibold text-teal-400">{pacNome}</span> — reativado</>,
      reverter_desativacao: <>Reverteu desativação de paciente <span className="font-semibold text-teal-400">{pacNome}</span> — reativado</>,
      reverter_reativacao: <>Reverteu reativação de paciente <span className="font-semibold text-amber-400">{pacNome}</span> — desativado novamente</>,
      reverter_edicao: <>Reverteu edição de paciente <span className="font-semibold text-violet-400">{pacNome}</span></>,
      reverter: <>Reverteu exclusão de paciente <span className="font-semibold text-orange-400">{pacNome}</span></>,
    }
    if (m[entry.acao]) return m[entry.acao]
  }
  if (entry.entidade === 'meta') {
    const indicador = INDICADOR_LABELS[entry.entidade_id] ?? entry.campo_alterado?.replace('indicador_', '') ?? entry.entidade_id
    if (entry.acao === 'criar') return (<>Definiu meta de <span className="font-semibold text-[var(--color-accent)]">{indicador}</span></>)
    if (entry.acao === 'editar') return (<>Alterou meta de <span className="font-semibold text-amber-400">{indicador}</span></>)
    if (entry.acao === 'reverter_edicao') return (<>Reverteu alteração de meta de <span className="font-semibold text-violet-400">{indicador}</span></>)
  }

  const entidadeLabel = ENTIDADE_LABELS[entry.entidade] ?? entry.entidade
  const humanName = (() => { try { if (!entry.payload) return entry.valor_novo; const pp = JSON.parse(entry.payload); return pp.antes?.nome ?? pp.depois?.nome ?? pp.antes?.paciente_nome ?? pp.depois?.paciente_nome ?? pp.original_entry?.valor_novo ?? pp.nome ?? pp.paciente_nome ?? entry.valor_novo } catch { return entry.valor_novo } })()

  if (entry.acao === 'reverter_criacao') return (<>Reverteu criação de {entidadeLabel} — <span className="font-semibold text-orange-400">{humanName}</span></>)
  if (entry.acao === 'reverter_exclusao') return (<>Re-registrou {entidadeLabel} — <span className="font-semibold text-cyan-400">{humanName}</span></>)
  if (entry.acao === 'reverter_edicao') return (<>Reverteu edição de {entidadeLabel} — <span className="font-semibold text-violet-400">{humanName}</span></>)

  return `${entry.acao} ${entry.entidade}`
}

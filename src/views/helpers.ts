/** Shared view helpers for TSX server-side rendering */

export function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const parts = d.split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function fmtTs(ts: string | null | undefined): string {
  if (!ts) return ''
  try {
    const d = new Date(typeof ts === 'string' ? ts.replace(' ', 'T') : ts)
    if (isNaN(d.getTime())) return String(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return String(ts) }
}

export function calcularIdade(dataNasc: string | null | undefined): number | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export function isMonthActive(month: number, inicio: number, fim: number): boolean {
  const s = inicio || 1
  const e = fim || 12
  return s <= e ? (month >= s && month <= e) : (month >= s || month <= e)
}

export const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
export const MESES_CURTOS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const INDICADOR_LABELS: Record<string, string> = {
  '01': 'Taxa de Altas (%)', '02': 'Intercorrências', '03': 'Taxa Internação (%)', '04': 'Óbitos',
  '05': 'Alteração PAD (%)', '06': 'Censo AD/ID', '07': 'Infectados', '08': 'Eventos Adversos', '09': 'Reclamações',
}

export const TIPO_EVENTO_LABELS: Record<string, string> = {
  alta: 'Alta', intercorrencia: 'Intercorrência', intern_deterioracao: 'Internação (deterioração)',
  intern_nao_aderencia: 'Internação (não aderência)', obito: 'Óbito', obito_menos_48h: 'Óbito <48h',
  obito_mais_48h: 'Óbito ≥48h', infectado: 'Infecção', ea_queda: 'EA: Queda',
  ea_broncoaspiracao: 'EA: Broncoaspiração', ea_lesao_pressura: 'EA: Lesão Pressão',
  ea_decanulacao: 'EA: Decanulação', ea_saida_gtt: 'EA: Saída GTT', evento_adverso: 'Evento Adverso',
  ouvidoria_elogio: 'Ouvidoria: Elogio', ouvidoria_sugestao: 'Ouvidoria: Sugestão',
  ouvidoria_reclamacao: 'Ouvidoria: Reclamação', intercorr_removida_dom: 'Intercorrência removida domicílio',
  intercorr_necessidade_rem: 'Necessidade remoção',
}

export const SENTIDO_CONFIG: Record<string, { label: string; color: string; bg: string; cls: string; arrow: string; barCls: string }> = {
  maior: { label: 'Maior melhor', color: '#34d399', bg: 'rgba(16,185,129,.12)', cls: 'text-emerald-400', arrow: '↑', barCls: 'bg-emerald-500' },
  menor: { label: 'Menor melhor', color: '#f87171', bg: 'rgba(239,68,68,.12)', cls: 'text-red-400', arrow: '↓', barCls: 'bg-red-500' },
  neutro: { label: 'Neutro', color: '#60a5fa', bg: 'rgba(59,130,246,.12)', cls: 'text-blue-400', arrow: '→', barCls: 'bg-blue-500' },
}

export const ACAO_COLORS: Record<string, { bg: string; text: string }> = {
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

export const ENTIDADE_LABELS: Record<string, string> = {
  evento_paciente: 'Evento Clínico', registro_mensal: 'Registro Mensal', paciente: 'Paciente', meta: 'Meta',
}

export const ICON_COLORS: Record<string, { color: string; bg: string }> = {
  '01': { color: '#34d399', bg: 'rgba(16,185,129,.15)' },
  '02': { color: '#fbbf24', bg: 'rgba(245,158,11,.15)' },
  '03': { color: '#f87171', bg: 'rgba(239,68,68,.15)' },
  '04': { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
  '05': { color: '#60a5fa', bg: 'rgba(59,130,246,.15)' },
  '06': { color: '#a78bfa', bg: 'rgba(139,92,246,.15)' },
  '07': { color: '#f97316', bg: 'rgba(249,115,22,.15)' },
  '08': { color: '#ec4899', bg: 'rgba(236,72,153,.15)' },
  '09': { color: '#22d3ee', bg: 'rgba(6,182,212,.15)' },
}

export function getAuditDescription(entry: {
  entidade: string; acao: string; campo_alterado: string | null;
  valor_anterior: string | null; valor_novo: string | null;
  payload: string | null; entidade_id: string;
}): string {
  let payload: Record<string, unknown> | null = null
  try { if (entry.payload) payload = JSON.parse(entry.payload) } catch { /* empty */ }
  const tipo = entry.campo_alterado ? (TIPO_EVENTO_LABELS[entry.campo_alterado] ?? entry.campo_alterado) : null
  const nome = (() => {
    try {
      const p = payload as Record<string, Record<string, unknown>> | null
      return p?.antes?.nome ?? p?.depois?.nome ?? (payload as Record<string, unknown>)?.nome ?? entry.valor_anterior ?? entry.valor_novo
    } catch { return entry.valor_novo }
  })()
  const indicador = INDICADOR_LABELS[entry.entidade_id] ?? entry.entidade_id

  if (entry.entidade === 'evento_paciente') {
    if (entry.acao === 'criar') return `Registrou ${tipo || 'evento'} — paciente ${nome || ''}`
    if (entry.acao === 'excluir') return `Reverteu ${tipo || 'evento'} — paciente ${nome || ''}`
  }
  if (entry.entidade === 'registro_mensal') {
    let periodo = ''
    try {
      const p = payload as Record<string, Record<string, unknown>> | null
      const a = p?.antes?.ano ?? p?.depois?.ano
      const m = p?.antes?.mes ?? p?.depois?.mes
      if (a && m) periodo = ` (${MESES_CURTOS[Number(m)]}/${a})`
    } catch { /* empty */ }
    if (entry.acao === 'confirmar') return `Confirmou registro mensal${periodo}`
    if (entry.acao === 'reverter_confirmacao') return `Reverteu confirmação de registro mensal${periodo}`
    if (entry.acao === 'criar') return `Criou registro mensal${periodo}`
  }
  if (entry.entidade === 'paciente') {
    if (entry.acao === 'criar') return `Cadastrou paciente ${nome || ''}`
    if (entry.acao === 'editar') return `Editou paciente ${nome || ''}`
    if (entry.acao === 'desativar') return `Desativou paciente ${nome || ''}`
    if (entry.acao === 'reativar') return `Reativou paciente ${nome || ''}`
    if (entry.acao === 'excluir') return `Excluiu paciente ${nome || ''}`
    if (entry.acao.startsWith('reverter')) return `Reverteu ${entry.acao.split('_').slice(1).join(' ')} de paciente ${nome || ''}`
  }
  if (entry.entidade === 'meta') {
    if (entry.acao === 'criar') return `Definiu meta de ${indicador}`
    if (entry.acao === 'editar') return `Alterou meta de ${indicador}`
  }
  return `${entry.acao} ${ENTIDADE_LABELS[entry.entidade] || entry.entidade}`
}

export function canRevert(entry: { revertido: boolean; acao: string }): boolean {
  return !entry.revertido && ['criar', 'editar', 'confirmar', 'desativar', 'reativar', 'excluir'].includes(entry.acao)
}

export function renderAuditPayload(entry: { payload: string | null; id: string; entidade: string; acao: string }): string {
  try {
    const p = entry.payload ? JSON.parse(entry.payload) : { id: entry.id, entidade: entry.entidade, acao: entry.acao }
    return JSON.stringify(p, null, 2)
  } catch { return entry.payload || 'N/A' }
}

import { useState, useEffect, useCallback } from 'react'
import { History, RotateCcw, Loader2, ChevronLeft, ChevronRight, X, Plus, Paperclip, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import { AnexoInput } from '@/components/AnexoInput'
import { Combobox } from '@/components/Combobox'

interface AuditEntry {
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

const ACAO_STYLES: Record<string, string> = {
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

const ACAO_DOT: Record<string, string> = {
  criar: 'bg-emerald-500',
  editar: 'bg-amber-500',
  confirmar: 'bg-blue-500',
  excluir: 'bg-red-500',
  reverter: 'bg-orange-500',
  reverter_criacao: 'bg-orange-500',
  reverter_exclusao: 'bg-cyan-500',
  reverter_edicao: 'bg-violet-500',
  reverter_confirmacao: 'bg-sky-500',
  desativar: 'bg-amber-500',
  reativar: 'bg-teal-500',
  reverter_desativacao: 'bg-teal-500',
  reverter_reativacao: 'bg-amber-500',
}

const ENTIDADE_LABELS: Record<string, string> = {
  evento_paciente: 'Evento Clínico',
  registro_mensal: 'Registro Mensal',
  paciente: 'Paciente',
  meta: 'Meta',
}

const TIPO_EVENTO_LABELS: Record<string, string> = {
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

const INDICADOR_LABELS: Record<string, string> = {
  '01': 'Taxa de Altas (%)',
  '02': 'Intercorrências',
  '03': 'Taxa Internação (%)',
  '04': 'Óbitos',
  '05': 'Alteração PAD (%)',
  '06': 'Censo AD/ID',
  '07': 'Infectados',
  '08': 'Eventos Adversos',
  '09': 'Reclamações',
  'IND-001': 'Taxa de Altas (%)',
  'IND-002': 'Intercorrências',
  'IND-003': 'Taxa Internação (%)',
  'IND-004': 'Óbitos',
  'IND-005': 'Alteração PAD (%)',
  'IND-006': 'Censo AD/ID',
  'IND-007': 'Infectados',
  'IND-008': 'Eventos Adversos',
  'IND-009': 'Reclamações',
}

/** Extrai informação contextual human-readable de uma entrada de auditoria */
function getEntitySummary(entry: AuditEntry): { title: string; lines: { label: string; value: string }[] } {
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

  // Extrair nome/identificação do payload
  let payloadData: Record<string, unknown> | null = null
  try {
    if (entry.payload) payloadData = JSON.parse(entry.payload)
  } catch { /* ignore */ }

  if (entry.entidade === 'evento_paciente') {
    const tipo = entry.campo_alterado
      ? (TIPO_EVENTO_LABELS[entry.campo_alterado] ?? entry.campo_alterado)
      : 'Evento'
    lines.push({ label: 'Tipo', value: tipo })
    const pacNome = (payloadData as Record<string, unknown>)?.paciente_nome
      ?? (payloadData as Record<string, unknown>)?.antes?.paciente_nome
      ?? entry.valor_novo
    if (pacNome) lines.push({ label: 'Paciente', value: String(pacNome) })
  } else if (entry.entidade === 'paciente') {
    const nome = (payloadData as Record<string, unknown>)?.antes?.nome
      ?? (payloadData as Record<string, unknown>)?.depois?.nome
      ?? (payloadData as Record<string, unknown>)?.nome
      ?? entry.valor_novo
    if (nome) lines.push({ label: 'Nome', value: String(nome) })
  } else if (entry.entidade === 'meta') {
    const indicador = INDICADOR_LABELS[entry.entidade_id] ?? entry.entidade_id
    lines.push({ label: 'Indicador', value: indicador })
    const antes = (payloadData as Record<string, unknown>)?.antes as Record<string, unknown> | undefined
    const depois = (payloadData as Record<string, unknown>)?.depois as Record<string, unknown> | undefined
    if (antes?.meta_valor != null) lines.push({ label: 'Meta anterior', value: String(antes.meta_valor) })
    if (depois?.meta_valor != null) lines.push({ label: 'Meta nova', value: String(depois.meta_valor) })
  } else if (entry.entidade === 'registro_mensal') {
    const ano = (payloadData as Record<string, unknown>)?.antes?.ano
      ?? (payloadData as Record<string, unknown>)?.depois?.ano
      ?? (payloadData as Record<string, unknown>)?.ano
    const mes = (payloadData as Record<string, unknown>)?.antes?.mes
      ?? (payloadData as Record<string, unknown>)?.depois?.mes
      ?? (payloadData as Record<string, unknown>)?.mes
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    if (ano && mes) lines.push({ label: 'Período', value: `${meses[Number(mes)]} ${ano}` })
    const status = (payloadData as Record<string, unknown>)?.antes?.status
      ?? (payloadData as Record<string, unknown>)?.depois?.status
    if (status) lines.push({ label: 'Status', value: status === 'confirmado' ? 'Confirmado' : 'Rascunho' })
  }

  return { title, lines }
}

function formatTimestamp(ts: string) {
  if (!ts) return ''
  const d = new Date(ts.replace(' ', 'T'))
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AuditoriaPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)

  // Filtros
  const [filtroEntidade, setFiltroEntidade] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')


  // Confirm revert
  const [confirmRevert, setConfirmRevert] = useState<AuditEntry | null>(null)
  const [reverting, setReverting] = useState(false)
  const [justificativaRevert, setJustificativaRevert] = useState('')
  const [arquivoRevert, setArquivoRevert] = useState<File | null>(null)

  // Re-register
  const [confirmReRegister, setConfirmReRegister] = useState<AuditEntry | null>(null)
  const [reRegistering, setReRegistering] = useState(false)
  const [justificativaReRegister, setJustificativaReRegister] = useState('')
  const [arquivoReRegister, setArquivoReRegister] = useState<File | null>(null)

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/auditoria?pagina=${pagina}&por_pagina=20`
      if (filtroEntidade) url += `&entidade=${filtroEntidade}`
      if (filtroAcao) url += `&acao=${filtroAcao}`

      const res = await api.get(url)
      const data = res.data as { dados: AuditEntry[]; paginacao: { total_registros: number; total_paginas: number } }
      setEntries(data.dados)
      setTotalPaginas(data.paginacao.total_paginas)
      setTotal(data.paginacao.total_registros)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroEntidade, filtroAcao])

  useEffect(() => { fetchAudit() }, [fetchAudit])

  // Handler genérico — funciona para qualquer entidade/ação
  const handleRevert = async (entry: AuditEntry) => {
    if (!justificativaRevert.trim()) return
    setReverting(true)
    try {
      const fd = new FormData()
      fd.append('justificativa', justificativaRevert)
      if (arquivoRevert) fd.append('arquivo', arquivoRevert)
      await api.post(`/auditoria/${entry.id}/reverter`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchAudit()
      setConfirmRevert(null)
      setJustificativaRevert('')
      setArquivoRevert(null)
    } catch (err) {
      console.error('Erro ao reverter:', err)
      alert('Erro ao reverter ação.')
    } finally {
      setReverting(false)
    }
  }

  const handleReRegister = async (entry: AuditEntry) => {
    if (!justificativaReRegister.trim()) return
    setReRegistering(true)
    try {
      const fd = new FormData()
      fd.append('justificativa', justificativaReRegister)
      if (arquivoReRegister) fd.append('arquivo', arquivoReRegister)
      await api.post(`/auditoria/${entry.id}/reverter`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchAudit()
      setConfirmReRegister(null)
      setJustificativaReRegister('')
      setArquivoReRegister(null)
    } catch (err) {
      console.error('Erro ao re-registrar:', err)
      alert('Erro ao re-registrar.')
    } finally {
      setReRegistering(false)
    }
  }

  // Pode reverter criação de qualquer entidade (se não já revertido)
  const canRevert = (entry: AuditEntry) =>
    entry.acao === 'criar' && !entry.revertido

  // Pode re-registrar exclusões de qualquer entidade (se não já revertido)
  const canReRegister = (entry: AuditEntry) =>
    entry.acao === 'excluir' && !entry.revertido

  // Pode reverter edições (se não já revertido)
  const canRevertEdit = (entry: AuditEntry) =>
    entry.acao === 'editar' && !entry.revertido && !!entry.valor_anterior

  const canRevertConfirm = (entry: AuditEntry) =>
    entry.acao === 'confirmar' && !entry.revertido

  const getDescription = (entry: AuditEntry) => {
    const tipo = entry.campo_alterado ? (TIPO_EVENTO_LABELS[entry.campo_alterado] ?? entry.campo_alterado) : null

    if (entry.entidade === 'evento_paciente') {
      if (entry.acao === 'criar') {
        return (<>Registrou <span className="font-semibold text-[var(--color-accent)]">{tipo}</span> — paciente <span className="font-semibold text-[var(--color-text-primary)]">{entry.valor_novo}</span></>)
      }
      if (entry.acao === 'excluir') {
        return (<>Reverteu <span className="font-semibold text-amber-400">{tipo}</span> — paciente <span className="font-semibold text-[var(--color-text-primary)]">{entry.valor_novo}</span></>)
      }
    }
    if (entry.entidade === 'registro_mensal') {
      const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      let periodo = ''
      try {
        if (entry.payload) {
          const p = JSON.parse(entry.payload)
          const ano = p.antes?.ano ?? p.depois?.ano ?? p.ano
          const mes = p.antes?.mes ?? p.depois?.mes ?? p.mes
          if (ano && mes) periodo = ` (${meses[Number(mes)]}/${ano})`
        }
      } catch { /* ignore */ }

      if (entry.acao === 'confirmar') return (<>Confirmou <span className="font-semibold text-blue-400">registro mensal{periodo}</span></>)
      if (entry.acao === 'reverter_confirmacao') return (<>Reverteu confirmação de <span className="font-semibold text-sky-400">registro mensal{periodo}</span> — voltou para rascunho</>)
      if (entry.acao === 'criar') return (<>Criou <span className="font-semibold text-emerald-400">registro mensal{periodo}</span></>)
      if (entry.acao === 'editar') return (<>Editou <span className="font-semibold text-amber-400">registro mensal{periodo}</span></>)
    }
    if (entry.entidade === 'paciente') {
      const pacNome = (() => { try { const p = entry.payload ? JSON.parse(entry.payload) : null; return p?.antes?.nome ?? p?.depois?.nome ?? p?.nome ?? entry.valor_novo } catch { return entry.valor_novo } })()
      if (entry.acao === 'criar') return (<>Cadastrou paciente <span className="font-semibold text-[var(--color-text-primary)]">{pacNome}</span></>)
      if (entry.acao === 'editar') return (<>Editou paciente <span className="font-semibold text-[var(--color-text-primary)]">{pacNome}</span></>)
      if (entry.acao === 'excluir' && entry.valor_anterior?.includes('ativo=')) {
        const novoAtivo = entry.valor_novo?.includes('ativo=0')
        return (<>{novoAtivo ? 'Desativou' : 'Reativou'} paciente <span className="font-semibold text-amber-400">{pacNome}</span></>)
      }
      if (entry.acao === 'excluir') return (<>Excluiu paciente <span className="font-semibold text-red-400">{pacNome}</span></>)
      if (entry.acao === 'reverter') return (<>Reverteu exclusão de paciente <span className="font-semibold text-orange-400">{pacNome}</span></>)
    }
    if (entry.entidade === 'meta') {
      const indicador = INDICADOR_LABELS[entry.entidade_id] ?? entry.campo_alterado?.replace('indicador_', '') ?? entry.entidade_id
      if (entry.acao === 'criar') return (<>Definiu meta de <span className="font-semibold text-[var(--color-accent)]">{indicador}</span></>)
      if (entry.acao === 'editar') return (<>Alterou meta de <span className="font-semibold text-amber-400">{indicador}</span></>)
      if (entry.acao === 'reverter_edicao') return (<>Reverteu alteração de meta de <span className="font-semibold text-violet-400">{indicador}</span></>)
    }

    // Ações de reversão genéricas — extrair identificação human-readable do payload
    const entidadeLabel = ENTIDADE_LABELS[entry.entidade] ?? entry.entidade
    const humanName = (() => {
      try {
        if (!entry.payload) return entry.valor_novo
        const p = JSON.parse(entry.payload)
        if (entry.entidade === 'meta') return INDICADOR_LABELS[entry.entidade_id] ?? entry.entidade_id
        return p.antes?.nome ?? p.depois?.nome ?? p.antes?.paciente_nome ?? p.depois?.paciente_nome
          ?? p.original_entry?.valor_novo ?? p.nome ?? p.paciente_nome ?? entry.valor_novo
      } catch { return entry.valor_novo }
    })()

    if (entry.acao === 'reverter_criacao') return (<>Reverteu criação de {entidadeLabel} — <span className="font-semibold text-orange-400">{humanName}</span></>)
    if (entry.acao === 'reverter_exclusao') return (<>Re-registrou {entidadeLabel} — <span className="font-semibold text-cyan-400">{humanName}</span></>)
    if (entry.acao === 'reverter_edicao') return (<>Reverteu edição de {entidadeLabel} — <span className="font-semibold text-violet-400">{humanName}</span></>)

    return `${entry.acao} ${entry.entidade}`
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-md)] bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <History size={16} className="sm:hidden" />
            <History size={20} className="hidden sm:block" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text-primary)]">Logs</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Histórico de todas as alterações — {total} registro{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-end relative z-10">
        <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[180px]">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Entidade</span>
          <Combobox
            options={[
              { value: 'evento_paciente', label: 'Eventos Clínicos' },
              { value: 'registro_mensal', label: 'Registros Mensais' },
              { value: 'paciente', label: 'Pacientes' },
              { value: 'meta', label: 'Metas' },
            ]}
            value={filtroEntidade}
            onChange={(v) => { setFiltroEntidade(v); setPagina(1) }}
            placeholder="Buscar entidade..."
            emptyLabel="Todas"
          />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[180px]">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Ação</span>
          <Combobox
            options={[
              { value: 'criar', label: 'Criar' },
              { value: 'editar', label: 'Editar' },
              { value: 'confirmar', label: 'Confirmar' },
              { value: 'excluir', label: 'Excluir / Reverter' },
              { value: 'desativar', label: 'Desativar' },
              { value: 'reativar', label: 'Reativar' },
            ]}
            value={filtroAcao}
            onChange={(v) => { setFiltroAcao(v); setPagina(1) }}
            placeholder="Buscar ação..."
            emptyLabel="Todas"
          />
        </div>
        {(filtroEntidade || filtroAcao) && (
          <button onClick={() => { setFiltroEntidade(''); setFiltroAcao(''); setPagina(1) }}
            className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors">
            <X size={12} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <History size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum registro de auditoria encontrado</p>
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div key={entry.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="glass-card p-4 group">
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

                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {getDescription(entry)}
                  </p>

                  {entry.justificativa && (
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 italic">"{entry.justificativa}"</p>
                  )}

                  {entry.documentacao_url && (
                    <a
                      href={`http://localhost:3001${entry.documentacao_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-[11px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                    >
                      <Paperclip size={11} />
                      {entry.documentacao_url.split('/').pop()}
                      <ExternalLink size={10} />
                    </a>
                  )}

                  {/* Detalhes da operação — sempre visível */}
                  <details className="mt-2 group">
                    <summary className="text-[10px] text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors select-none">
                      📋 Detalhes da operação
                    </summary>
                    <div className="mt-1.5 text-[10px] bg-[var(--color-surface-0)] rounded-[var(--radius-md)] border border-[var(--overlay-border)] overflow-hidden">
                      {(() => {
                        const parsed = entry.payload ? JSON.parse(entry.payload) : null
                        const hasDiff = parsed && parsed.antes !== undefined && parsed.depois !== undefined

                        if (hasDiff) {
                          const antes = parsed.antes ?? {}
                          const depois = parsed.depois ?? {}
                          const allKeys = [...new Set([...Object.keys(antes), ...Object.keys(depois)])]
                            .filter(k => !['criado_em', 'atualizado_em'].includes(k))
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
                                        {antes[k] !== undefined && (
                                          <span className="text-rose-400 bg-rose-500/5 px-1 rounded">- {JSON.stringify(antes[k])}</span>
                                        )}
                                        {depois[k] !== undefined && (
                                          <span className="text-emerald-400 bg-emerald-500/5 px-1 rounded">+ {JSON.stringify(depois[k])}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {unchanged.length > 0 && (
                                <details className="p-2.5">
                                  <summary className="text-[9px] text-[var(--color-text-muted)] cursor-pointer select-none">
                                    {unchanged.length} campo(s) inalterado(s)
                                  </summary>
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

                        // Payload sem diff — renderizar como tabela de propriedades
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
                      })()}
                    </div>
                  </details>

                  {/* Ações — apenas se NÃO foi revertido */}
                  {!entry.revertido && (canRevert(entry) || canReRegister(entry) || canRevertEdit(entry) || canRevertConfirm(entry)) && (
                    <div className="mt-3 pt-2 border-t border-[var(--overlay-border)] flex gap-2 flex-wrap">
                      {canRevert(entry) && (
                        <button onClick={() => { setConfirmRevert(entry); setJustificativaRevert('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                          <RotateCcw size={12} /> Reverter criação
                        </button>
                      )}
                      {canReRegister(entry) && (
                        <button onClick={() => setConfirmReRegister(entry)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                          <Plus size={12} /> Re-registrar
                        </button>
                      )}
                      {canRevertConfirm(entry) && (
                        <button onClick={() => { setConfirmRevert(entry); setJustificativaRevert('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors border border-sky-500/20">
                          <RotateCcw size={12} /> Reverter confirmação
                        </button>
                      )}
                      {canRevertEdit(entry) && (
                        <button onClick={() => { setConfirmRevert(entry); setJustificativaRevert('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors border border-violet-500/20">
                          <RotateCcw size={12} /> Reverter edição
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className={clsx('p-2 rounded-[var(--radius-md)] transition-colors',
              pagina === 1 ? 'text-[var(--color-surface-3)] cursor-not-allowed' : 'text-[var(--color-text-secondary)] hover:bg-[var(--overlay-soft)]')}>
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[var(--color-text-muted)] tabular-nums">
            Página <span className="text-[var(--color-text-primary)] font-semibold">{pagina}</span> de {totalPaginas}
          </span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className={clsx('p-2 rounded-[var(--radius-md)] transition-colors',
              pagina === totalPaginas ? 'text-[var(--color-surface-3)] cursor-not-allowed' : 'text-[var(--color-text-secondary)] hover:bg-[var(--overlay-soft)]')}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal: Confirmar reversão */}
      {confirmRevert && (() => {
        const summary = getEntitySummary(confirmRevert)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmRevert(null); setJustificativaRevert(''); setArquivoRevert(null) }} />
            <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3">{summary.title}</h3>
              {summary.lines.map((line, i) => (
                <p key={i} className="text-sm text-[var(--color-text-muted)] mb-1.5">
                  {line.label}: <span className="text-[var(--color-text-primary)] font-semibold">{line.value}</span>
                </p>
              ))}
              <label className="flex flex-col gap-1.5 mb-4 mt-3">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Justificativa *</span>
                <textarea
                  value={justificativaRevert}
                  onChange={e => setJustificativaRevert(e.target.value)}
                  placeholder="Motivo da reversão..."
                  rows={3}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </label>
              <div className="mb-4">
                <AnexoInput arquivo={arquivoRevert} onChange={setArquivoRevert} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setConfirmRevert(null); setJustificativaRevert(''); setArquivoRevert(null) }}
                  className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors">
                  Cancelar
                </button>
                <button onClick={() => handleRevert(confirmRevert)}
                  disabled={reverting || !justificativaRevert.trim()}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                    justificativaRevert.trim() ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                  )}>
                  {reverting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Reverter
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal: Confirmar re-registro */}
      {confirmReRegister && (() => {
        const summary = getEntitySummary(confirmReRegister)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmReRegister(null); setJustificativaReRegister(''); setArquivoReRegister(null) }} />
            <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3">{summary.title}</h3>
              {summary.lines.map((line, i) => (
                <p key={i} className="text-sm text-[var(--color-text-muted)] mb-1.5">
                  {line.label}: <span className="text-[var(--color-text-primary)] font-semibold">{line.value}</span>
                </p>
              ))}
              <label className="flex flex-col gap-1.5 mb-4 mt-3">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Justificativa <span className="text-red-400">*</span></span>
                <textarea
                  value={justificativaReRegister}
                  onChange={e => setJustificativaReRegister(e.target.value)}
                  placeholder="Motivo do re-registro..."
                  rows={3}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </label>
              <div className="mb-4">
                <AnexoInput arquivo={arquivoReRegister} onChange={setArquivoReRegister} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setConfirmReRegister(null); setJustificativaReRegister(''); setArquivoReRegister(null) }}
                  className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors">
                  Cancelar
                </button>
                <button onClick={() => handleReRegister(confirmReRegister)}
                  disabled={reRegistering || !justificativaReRegister.trim()}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                    justificativaReRegister.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                  )}>
                  {reRegistering ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Re-registrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

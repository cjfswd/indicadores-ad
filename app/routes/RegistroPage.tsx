import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Check, Plus, ChevronDown, ChevronRight, Loader2, X, Trash2, Calendar, Paperclip, ExternalLink, Download, Users, LayoutGrid } from 'lucide-react'
import { clsx } from 'clsx'
import { apiClient, type EventoResponse } from '~/lib/api-client'
import { AnexoInput } from '~/components/AnexoInput'
import { Combobox } from '~/components/Combobox'
import { exportarRelatorio } from '~/lib/export-report'

const GRUPOS = [
  { codigo: '01', titulo: 'Altas Domiciliares', campos: [
    { key: 'taxa_altas_pct', label: 'Altas', tipoEvento: 'alta' },
  ]},
  { codigo: '02', titulo: 'Intercorrências', campos: [
    { key: 'intercorrencias_total', label: 'Total', tipoEvento: 'intercorrencia' },
    { key: 'intercorr_removidas_dom', label: 'Resolvidas domicílio', tipoEvento: 'intercorr_removida_dom' },
    { key: 'intercorr_necessidade_rem', label: 'Necessidade remoção', tipoEvento: 'intercorr_necessidade_rem' },
  ]},
  { codigo: '03', titulo: 'Internação Hospitalar', campos: [
    { key: 'intern_deterioracao', label: 'Deterioração clínica', tipoEvento: 'intern_deterioracao' },
    { key: 'intern_nao_aderencia', label: 'Não aderência', tipoEvento: 'intern_nao_aderencia' },
  ]},
  { codigo: '04', titulo: 'Óbitos', campos: [
    { key: 'obitos_total', label: 'Total', tipoEvento: 'obito' },
    { key: 'obitos_menos_48h', label: '< 48h implantação', tipoEvento: 'obito_menos_48h' },
    { key: 'obitos_mais_48h', label: '≥ 48h implantação', tipoEvento: 'obito_mais_48h' },
  ]},
  { codigo: '07', titulo: 'Controle de Infecção', campos: [
    { key: 'pacientes_infectados', label: 'Pacientes infectados', tipoEvento: 'infectado' },
  ]},
  { codigo: '08', titulo: 'Eventos Adversos', campos: [
    { key: 'eventos_adversos_total', label: 'Total EA', tipoEvento: 'evento_adverso' },
    { key: 'ea_quedas', label: 'Quedas', tipoEvento: 'ea_queda' },
    { key: 'ea_broncoaspiracao', label: 'Broncoaspiração', tipoEvento: 'ea_broncoaspiracao' },
    { key: 'ea_lesao_pressao', label: 'Lesão por Pressão', tipoEvento: 'ea_lesao_pressao' },
    { key: 'ea_decanulacao', label: 'Decanulação', tipoEvento: 'ea_decanulacao' },
    { key: 'ea_saida_gtt', label: 'Saída GTT', tipoEvento: 'ea_saida_gtt' },
  ]},
  { codigo: '09', titulo: 'Ouvidorias', campos: [
    { key: 'ouv_elogios', label: 'Elogios', tipoEvento: 'ouvidoria_elogio' },
    { key: 'ouv_sugestoes', label: 'Sugestões', tipoEvento: 'ouvidoria_sugestao' },
    { key: 'ouv_reclamacoes', label: 'Reclamações', tipoEvento: 'ouvidoria_reclamacao' },
  ]},
] as const

interface PacienteLista { id: string; nome: string; convenio: string; modalidade: string }
interface EventoRegistrado {
  id: string; paciente_id: string; paciente_nome: string; paciente_convenio: string
  tipo_evento: string; descricao: string | null; data_evento: string; criado_em: string
}
type Valores = Record<string, number>

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function RegistroPage({ serverData }: { serverData?: { dados: Record<string, unknown>[]; ano: number } }) {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [valores, setValores] = useState<Valores>({})
  const [registroId, setRegistroId] = useState<string | null>(null)
  const [statusReg, setStatusReg] = useState<'rascunho' | 'confirmado'>('rascunho')
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const [pacientes, setPacientes] = useState<PacienteLista[]>([])
  const [eventos, setEventos] = useState<EventoRegistrado[]>([])

  // Modal
  const [modal, setModal] = useState<{ tipoEvento: string; label: string } | null>(null)
  const [modalPaciente, setModalPaciente] = useState('')
  const [modalDescricao, setModalDescricao] = useState('')
  const [modalArquivo, setModalArquivo] = useState<File | null>(null)
  const [modalData, setModalData] = useState(now.toISOString().slice(0, 10))
  const [modalSaving, setModalSaving] = useState(false)

  // Filtros
  const [filtroPaciente, setFiltroPaciente] = useState('')
  const [filtroOperadora, setFiltroOperadora] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')


  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [justificativaDelete, setJustificativaDelete] = useState('')
  const [arquivoDelete, setArquivoDelete] = useState<File | null>(null)

  const isCollapsed = (cod: string) => collapsed.has(cod)
  const toggleCollapse = (cod: string) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(cod) ? n.delete(cod) : n.add(cod); return n })
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [regData, pacData, evData] = await Promise.all([
        apiClient.registros.buscarMes(ano, mes).catch(() => null),
        apiClient.pacientes.listar({ status: 'ativo' }),
        apiClient.eventos.listar({ ano, mes }),
      ])
      if (regData) {
        const d = regData as Record<string, unknown>
        setRegistroId(d.id as string)
        setStatusReg(d.status as 'rascunho' | 'confirmado')
        const vals: Valores = {}
        for (const g of GRUPOS) for (const c of g.campos) vals[c.key] = Number(d[c.key] ?? 0)
        setValores(vals)
      } else {
        setRegistroId(null); setStatusReg('rascunho')
        const vals: Valores = {}
        for (const g of GRUPOS) for (const c of g.campos) vals[c.key] = 0
        setValores(vals)
      }
      setPacientes(pacData.dados as PacienteLista[])
      setEventos(evData.dados as EventoRegistrado[])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [ano, mes])

  useEffect(() => { fetchAll() }, [fetchAll])

  const abrirModalIncremento = (tipoEvento: string, label: string) => {
    if (statusReg === 'confirmado') return
    setModal({ tipoEvento, label })
    setModalPaciente(''); setModalDescricao(''); setModalData(now.toISOString().slice(0, 10)); setModalArquivo(null)
  }

  const confirmarEvento = async () => {
    if (!modal || !modalPaciente) return
    setModalSaving(true)
    try {
      let regId = registroId
      if (!regId) {
        const created = await apiClient.registros.criar({ ano, mes })
        regId = created.id
        setRegistroId(regId)
      }
      const fd = new FormData()
      fd.append('paciente_id', modalPaciente)
      fd.append('ano', String(ano))
      fd.append('mes', String(mes))
      fd.append('tipo_evento', modal.tipoEvento)
      if (modalDescricao) fd.append('descricao', modalDescricao)
      fd.append('data_evento', modalData)
      if (modalArquivo) fd.append('arquivo', modalArquivo)

      await apiClient.eventos.criar(fd)

      await fetchAll(); setModal(null)
    } catch (err) { console.error('Erro:', err) }
    finally { setModalSaving(false) }
  }

  const removerEvento = async (id: string) => {
    if (!justificativaDelete.trim()) return
    try {
      const fd = new FormData()
      fd.append('justificativa', justificativaDelete)
      if (arquivoDelete) fd.append('arquivo', arquivoDelete)
      await apiClient.eventos.excluir(id, fd)
      await fetchAll()
    } catch (err) { console.error('Erro:', err) }
    setConfirmDeleteId(null)
    setJustificativaDelete('')
    setArquivoDelete(null)
  }

  const confirmarRegistro = async () => {
    if (!registroId) return
    try { await apiClient.registros.confirmar(registroId); setStatusReg('confirmado') }
    catch (err) { console.error('Erro:', err) }
  }

  const isLocked = statusReg === 'confirmado'
  const eventosPorTipo = (tipo: string) => {
    let filtered = eventos.filter(e => e.tipo_evento === tipo)
    if (filtroPaciente) filtered = filtered.filter(e => e.paciente_id === filtroPaciente)
    if (filtroOperadora) filtered = filtered.filter(e => e.paciente_convenio === filtroOperadora)
    return filtered
  }

  const gruposFiltrados = filtroGrupo ? GRUPOS.filter(g => g.codigo === filtroGrupo) : GRUPOS
  const operadoras = [...new Set(pacientes.map(p => p.convenio))].sort()

  const pacienteOptions = pacientes
    .filter(p => !filtroOperadora || p.convenio === filtroOperadora)
    .map(p => ({ value: p.id, label: p.nome, sublabel: p.convenio }))
  const operadoraOptions = operadoras.map(o => ({ value: o, label: o }))
  const grupoOptions = GRUPOS.map(g => ({ value: g.codigo, label: `${g.codigo} — ${g.titulo}` }))
  const allPacienteOptions = pacientes.map(p => ({ value: p.id, label: p.nome, sublabel: `${p.convenio} (${p.modalidade})` }))
  const filtrosRefinamento = [filtroPaciente, filtroOperadora, filtroGrupo].filter(Boolean)
  const temFiltroAtivo = filtrosRefinamento.length > 0

  const limparFiltros = () => {
    setFiltroPaciente(''); setFiltroOperadora(''); setFiltroGrupo('')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-md)] bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <ClipboardList size={16} className="sm:hidden" />
            <ClipboardList size={20} className="hidden sm:block" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text-primary)]">Registro Mensal</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
              Cada alteração é vinculada a um paciente com rastreabilidade completa
            </p>
          </div>
        </div>
        <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold',
            isLocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400')}>
            {isLocked ? '✓ Confirmado' : 'Rascunho'}
          </span>
      </div>

      {/* ── Filtros unificados ── */}
      <div className="glass-card relative z-10">
        {/* Header: mês/ano sempre visível + toggle filtros */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-[var(--overlay-border)] bg-[var(--overlay-soft)] flex-wrap">
          <Calendar size={14} className="text-[var(--color-accent)]" />
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-all">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-all">
            {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

          {temFiltroAtivo && (
            <button onClick={limparFiltros}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-red-400 flex items-center gap-0.5 transition-colors">
              <X size={10} /> Limpar filtros
            </button>
          )}
        </div>

        {/* Filters — always visible */}
        <div className="px-3 sm:px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Operadora */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Users size={10} /> Operadora
              </span>
              <Combobox
                options={operadoraOptions}
                value={filtroOperadora}
                onChange={setFiltroOperadora}
                placeholder="Buscar operadora..."
                emptyLabel="Todas"
              />
            </div>

            {/* Paciente */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Users size={10} /> Paciente
              </span>
              <Combobox
                options={pacienteOptions}
                value={filtroPaciente}
                onChange={setFiltroPaciente}
                placeholder="Buscar paciente..."
                emptyLabel="Todos"
              />
            </div>

            {/* Grupo indicador */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <LayoutGrid size={10} /> Indicador
              </span>
              <Combobox
                options={grupoOptions}
                value={filtroGrupo}
                onChange={setFiltroGrupo}
                placeholder="Buscar indicador..."
                emptyLabel="Todos"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-card px-3 sm:px-4 py-3 gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-primary)] font-semibold">{eventos.length}</span> evento{eventos.length !== 1 ? 's' : ''} registrado{eventos.length !== 1 ? 's' : ''} em {MESES[mes - 1]}
        </span>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => exportarRelatorio({
              titulo: 'Registro Mensal — Indicadores AD',
              subtitulo: `${MESES[mes - 1]} ${ano}${filtroOperadora ? ` · ${filtroOperadora}` : ''}${filtroGrupo ? ` · Grupo ${filtroGrupo}` : ''}`,
              elementIds: ['registro-content'],
              nomeArquivo: `registro_${ano}_${String(mes).padStart(2, '0')}`,
            })}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] transition-colors">
            <Download size={14} /> Exportar PDF
          </button>
          {!isLocked && registroId && (
            <button onClick={confirmarRegistro}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
              <Check size={14} /> Confirmar Mês
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
        </div>
      ) : (
        <div id="registro-content" className="space-y-4">
          {gruposFiltrados.map((grupo, gi) => (
            <div key={grupo.codigo} className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: `${gi * 40}ms` }}>
              {/* Grupo Header */}
              <button onClick={() => toggleCollapse(grupo.codigo)}
                className="w-full flex items-center gap-2 px-3 sm:px-5 py-3.5 hover:bg-[var(--overlay-soft)] transition-colors">
                {isCollapsed(grupo.codigo) ? <ChevronRight size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
                <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--overlay-soft)] px-2 py-0.5 rounded">{grupo.codigo}</span>
                <span className="text-sm font-semibold text-[var(--color-accent)]">{grupo.titulo}</span>
              </button>

              {/* Grupo Content */}
              {!isCollapsed(grupo.codigo) && (
                <div className="border-t border-[var(--overlay-border)]">
                  {grupo.campos.map((campo, ci) => {
                    const val = valores[campo.key] ?? 0
                    const evts = eventosPorTipo(campo.tipoEvento)

                    return (
                      <div key={campo.key} className={clsx(ci > 0 && 'border-t border-[var(--overlay-border)]')}>
                        {/* Campo header com contador e botão + */}
                        <div className="flex items-center justify-between px-3 sm:px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">{campo.label}</span>
                            <span className={clsx(
                              'text-lg font-bold tabular-nums',
                              val > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-surface-3)]',
                            )}>{val}</span>
                          </div>
                          {!isLocked && (
                            <button onClick={() => abrirModalIncremento(campo.tipoEvento, campo.label)}
                              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-[var(--radius-md)] text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all border border-emerald-500/20">
                              <Plus size={10} className="sm:hidden" /><Plus size={12} className="hidden sm:inline" /> <span className="hidden sm:inline">Registrar</span>
                            </button>
                          )}
                        </div>

                        {/* Lista de eventos — SEMPRE visível */}
                        {evts.length > 0 && (
                          <div className="px-3 sm:px-5 pb-3 space-y-1.5">
                            {evts.map((ev, ei) => (
                              <div key={ev.id}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--overlay-soft)] border border-[var(--overlay-border)] group animate-slide-in"
                                style={{ animationDelay: `${ei * 30}ms` }}>
                                {/* Timeline dot */}
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                                </div>

                                {/* Event content */}
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
                                    {(ev as Record<string, unknown>).documentacao_url && (
                                      <a href={`${(ev as Record<string, unknown>).documentacao_url}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                        <Paperclip size={10} /> Anexo
                                        <ExternalLink size={8} />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Delete button */}
                                {!isLocked && (
                                  <button onClick={() => setConfirmDeleteId(ev.id)}
                                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-surface-3)] sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                                    title="Remover evento (decrementa)">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Estado vazio */}
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
          ))}
        </div>
      )}

      {/* ── Modal: Registrar Evento ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Registrar Evento</h2>
                <p className="text-sm text-[var(--color-accent)] font-medium mt-0.5">{modal.label}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Paciente *</span>
                <Combobox
                  options={allPacienteOptions}
                  value={modalPaciente}
                  onChange={setModalPaciente}
                  placeholder="Buscar paciente..."
                  emptyLabel="Selecione o paciente"
                  autoFocus
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Data do evento</span>
                <input type="date" value={modalData} onChange={e => setModalData(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)]" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Descrição / Observação</span>
                <textarea value={modalDescricao} onChange={e => setModalDescricao(e.target.value)}
                  placeholder="Detalhes do evento..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] resize-none" />
              </label>

              <AnexoInput arquivo={modalArquivo} onChange={setModalArquivo} />
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--overlay-border)]">
              <button onClick={() => setModal(null)}
                className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarEvento}
                disabled={!modalPaciente || modalSaving}
                className={clsx(
                  'flex items-center gap-2 px-3 sm:px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  modalPaciente ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                )}>
                {modalSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Registrar Evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar remoção ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmDeleteId(null); setJustificativaDelete(''); setArquivoDelete(null) }} />
          <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">Remover evento?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              O contador será decrementado e o evento será removido. Esta ação fica registrada na auditoria.
            </p>
            <label className="flex flex-col gap-1.5 mb-4">
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Justificativa *</span>
              <textarea
                value={justificativaDelete}
                onChange={e => setJustificativaDelete(e.target.value)}
                placeholder="Motivo da remoção do evento..."
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
            </label>
            <div className="mb-4">
              <AnexoInput arquivo={arquivoDelete} onChange={setArquivoDelete} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmDeleteId(null); setJustificativaDelete(''); setArquivoDelete(null) }}
                className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors">
                Cancelar
              </button>
              <button onClick={() => removerEvento(confirmDeleteId)}
                disabled={!justificativaDelete.trim()}
                className={clsx(
                  'px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  justificativaDelete.trim() ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                )}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Check, Plus, Loader2, Download } from 'lucide-react'
import { clsx } from 'clsx'
import { apiClient } from '@/lib/api-client'
import { exportarRelatorio } from '@/lib/export-report'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Modal } from '@/components/Modal'
import { FormField } from '@/components/FormField'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Combobox } from '@/components/Combobox'
import { AnexoInput } from '@/components/AnexoInput'
import { RegistroFilters } from '@/components/registro/RegistroFilters'
import { RegistroGrupoCard } from '@/components/registro/RegistroGrupoCard'
import type { EventoRegistrado } from '@/components/registro/EventoItem'

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
type Valores = Record<string, number>

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function RegistroPage() {
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

  // Filters
  const [filtroPaciente, setFiltroPaciente] = useState('')
  const [filtroOperadora, setFiltroOperadora] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const isLocked = statusReg === 'confirmado'

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

  const eventosPorTipo = (tipo: string) => {
    let filtered = eventos.filter(e => e.tipo_evento === tipo)
    if (filtroPaciente) filtered = filtered.filter(e => e.paciente_id === filtroPaciente)
    if (filtroOperadora) filtered = filtered.filter(e => e.paciente_convenio === filtroOperadora)
    return filtered
  }

  const abrirModalIncremento = (tipoEvento: string, label: string) => {
    if (isLocked) return
    setModal({ tipoEvento, label })
    setModalPaciente(''); setModalDescricao(''); setModalData(now.toISOString().slice(0, 10)); setModalArquivo(null)
  }

  const confirmarEvento = async () => {
    if (!modal || !modalPaciente) return
    setModalSaving(true)
    try {
      let regId = registroId
      if (!regId) { const created = await apiClient.registros.criar({ ano, mes }); regId = created.id; setRegistroId(regId) }
      const fd = new FormData()
      fd.append('paciente_id', modalPaciente); fd.append('ano', String(ano)); fd.append('mes', String(mes))
      fd.append('tipo_evento', modal.tipoEvento)
      if (modalDescricao) fd.append('descricao', modalDescricao)
      fd.append('data_evento', modalData)
      if (modalArquivo) fd.append('arquivo', modalArquivo)
      await apiClient.eventos.criar(fd)
      await fetchAll(); setModal(null)
    } catch (err) { console.error('Erro:', err) }
    finally { setModalSaving(false) }
  }

  const removerEvento = async (id: string, justificativa: string, arquivo: File | null) => {
    try {
      const fd = new FormData()
      fd.append('justificativa', justificativa)
      if (arquivo) fd.append('arquivo', arquivo)
      await apiClient.eventos.excluir(id, fd)
      await fetchAll()
    } catch (err) { console.error('Erro:', err) }
    setConfirmDeleteId(null)
  }

  const confirmarRegistro = async () => {
    if (!registroId) return
    try { await apiClient.registros.confirmar(registroId); setStatusReg('confirmado') }
    catch (err) { console.error('Erro:', err) }
  }

  const gruposFiltrados = filtroGrupo ? GRUPOS.filter(g => g.codigo === filtroGrupo) : GRUPOS
  const operadoras = [...new Set(pacientes.map(p => p.convenio))].sort()
  const pacienteOptions = pacientes.filter(p => !filtroOperadora || p.convenio === filtroOperadora).map(p => ({ value: p.id, label: p.nome, sublabel: p.convenio }))
  const allPacienteOptions = pacientes.map(p => ({ value: p.id, label: p.nome, sublabel: `${p.convenio} (${p.modalidade})` }))

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={<ClipboardList size={20} />}
        iconClassName="bg-indigo-500/15 text-indigo-400"
        title="Registro Mensal"
        subtitle="Cada alteração é vinculada a um paciente com rastreabilidade completa"
        actions={
          <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold',
            isLocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400')}>
            {isLocked ? '✓ Confirmado' : 'Rascunho'}
          </span>
        }
      />

      <RegistroFilters
        ano={ano} mes={mes} onAnoChange={setAno} onMesChange={setMes}
        filtroPaciente={filtroPaciente} filtroOperadora={filtroOperadora} filtroGrupo={filtroGrupo}
        onFiltroPacienteChange={setFiltroPaciente} onFiltroOperadoraChange={setFiltroOperadora} onFiltroGrupoChange={setFiltroGrupo}
        pacienteOptions={pacienteOptions}
        operadoraOptions={operadoras.map(o => ({ value: o, label: o }))}
        grupoOptions={GRUPOS.map(g => ({ value: g.codigo, label: `${g.codigo} — ${g.titulo}` }))}
      />

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-card px-3 sm:px-4 py-3 gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-primary)] font-semibold">{eventos.length}</span> evento{eventos.length !== 1 ? 's' : ''} registrado{eventos.length !== 1 ? 's' : ''} em {MESES[mes - 1]}
        </span>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button onClick={() => exportarRelatorio({
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

      {loading ? <LoadingSpinner /> : (
        <div id="registro-content" className="space-y-4">
          {gruposFiltrados.map((grupo, gi) => (
            <RegistroGrupoCard key={grupo.codigo} grupo={grupo} index={gi}
              collapsed={collapsed.has(grupo.codigo)} locked={isLocked} valores={valores}
              onToggle={() => setCollapsed(prev => { const n = new Set(prev); n.has(grupo.codigo) ? n.delete(grupo.codigo) : n.add(grupo.codigo); return n })}
              onRegistrar={abrirModalIncremento} onDeleteEvento={setConfirmDeleteId}
              eventosPorTipo={eventosPorTipo} />
          ))}
        </div>
      )}

      {/* Modal: Registrar Evento */}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title="Registrar Evento" subtitle={modal?.label} maxWidth="md"
        actions={
          <>
            <button onClick={() => setModal(null)}
              className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors">
              Cancelar
            </button>
            <button onClick={confirmarEvento} disabled={!modalPaciente || modalSaving}
              className={clsx(
                'flex items-center gap-2 px-3 sm:px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                modalPaciente ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
              )}>
              {modalSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Registrar Evento
            </button>
          </>
        }>
        <div className="space-y-4">
          <FormField label="Paciente" required>
            <Combobox options={allPacienteOptions} value={modalPaciente} onChange={setModalPaciente}
              placeholder="Buscar paciente..." emptyLabel="Selecione o paciente" autoFocus />
          </FormField>
          <FormField label="Data do evento">
            <input type="date" value={modalData} onChange={e => setModalData(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)]" />
          </FormField>
          <FormField label="Descrição / Observação">
            <textarea value={modalDescricao} onChange={e => setModalDescricao(e.target.value)}
              placeholder="Detalhes do evento..." rows={3}
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] resize-none" />
          </FormField>
          <AnexoInput arquivo={modalArquivo} onChange={setModalArquivo} />
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}
        onConfirm={(just, arq) => { if (confirmDeleteId) removerEvento(confirmDeleteId, just, arq) }}
        title="Remover evento?" description="O contador será decrementado e o evento será removido. Esta ação fica registrada na auditoria."
        confirmLabel="Remover" variant="danger" placeholder="Motivo da remoção do evento..." />
    </div>
  )
}

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Users, Plus, UserX, UserCheck } from 'lucide-react'
import { apiClient, type PacienteResponse } from '@/lib/api-client'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { StatusFilter } from '@/components/StatusFilter'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Combobox } from '@/components/Combobox'
import { PacienteConvenioGroup } from '@/components/pacientes/PacienteConvenioGroup'
import { PacienteFormModal, EMPTY_FORM, type PacienteForm } from '@/components/pacientes/PacienteFormModal'
import type { PacienteLocal } from '@/components/pacientes/PacienteListItem'

const INITIAL_DATA: PacienteLocal[] = [
  { id: '1', nome: 'Maria Silva Santos', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '1948-03-12', observacoes: null, status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
  { id: '2', nome: 'João Carlos Pereira', convenio: 'Unimed', modalidade: 'ID', data_nascimento: '1955-07-20', observacoes: 'Paciente com traqueostomia', status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
  { id: '3', nome: 'Ana Beatriz Oliveira', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '1940-11-05', observacoes: null, status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
  { id: '4', nome: 'Pedro Augusto Lima', convenio: 'Unimed', modalidade: 'ID', data_nascimento: '1962-01-30', observacoes: null, status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
  { id: '5', nome: 'Francisca das Dores', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '1938-09-18', observacoes: null, status: 'inativo', motivo_desativacao: 'Óbito em domicílio', indicador_desativacao: '04' },
  { id: '6', nome: 'Roberto Mendes Junior', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '1970-05-14', observacoes: 'Dieta por GTT', status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
  { id: '7', nome: 'Luciana Ferraz Costa', convenio: 'Unimed', modalidade: 'AD', data_nascimento: '1985-12-01', observacoes: null, status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
  { id: '8', nome: 'Antônio de Souza', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '1945-06-22', observacoes: null, status: 'ativo', motivo_desativacao: null, indicador_desativacao: null },
]

const INDICADORES_DESATIVACAO = [
  { codigo: '01', nome: 'Alta Domiciliar' },
  { codigo: '03', nome: 'Internação Hospitalar' },
  { codigo: '04', nome: 'Óbito' },
] as const

export function PacientesPage() {
  const [pacientes, setPacientes] = useState<PacienteLocal[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'ativo' | 'inativo' | 'todos'>('ativo')

  const fetchPacientes = useCallback(async () => {
    try {
      const data = await apiClient.pacientes.listar({ status: filtroStatus })
      setPacientes(data.dados.map((p: PacienteResponse) => ({
        id: p.id, nome: p.nome, convenio: p.convenio,
        modalidade: p.modalidade ?? 'AD', data_nascimento: p.data_nascimento,
        observacoes: p.observacoes, status: p.status,
        motivo_desativacao: p.motivo_desativacao, indicador_desativacao: p.indicador_desativacao,
      })))
    } catch {
      setPacientes(INITIAL_DATA)
    } finally {
      setLoading(false)
    }
  }, [filtroStatus])

  useEffect(() => { fetchPacientes() }, [fetchPacientes])

  const [busca, setBusca] = useState('')
  const [filtroConvenio, setFiltroConvenio] = useState('todos')
  const [expandedConvenios, setExpandedConvenios] = useState<Set<string>>(new Set())

  // Modal state
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<PacienteForm>(EMPTY_FORM)
  const [arquivoForm, setArquivoForm] = useState<File | null>(null)

  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [desativarId, setDesativarId] = useState<string | null>(null)
  const [indicadorDesativar, setIndicadorDesativar] = useState('')

  // Filtered + grouped
  const filtrados = useMemo(() =>
    pacientes.filter(p => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.convenio.toLowerCase().includes(busca.toLowerCase())
      const matchConv = filtroConvenio === 'todos' || p.convenio === filtroConvenio
      return matchBusca && matchConv
    }), [pacientes, busca, filtroConvenio])

  const agrupados = useMemo(() => {
    const grupos = new Map<string, PacienteLocal[]>()
    for (const p of filtrados) {
      const list = grupos.get(p.convenio) ?? []
      list.push(p)
      grupos.set(p.convenio, list)
    }
    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtrados])

  const todosConvenios = useMemo(() => [...new Set(pacientes.map(p => p.convenio))].sort(), [pacientes])

  const toggleGrupo = (conv: string) => {
    setExpandedConvenios(prev => { const n = new Set(prev); n.has(conv) ? n.delete(conv) : n.add(conv); return n })
  }
  const isExpanded = (conv: string) => !expandedConvenios.has(conv)

  // CRUD handlers
  const abrirCriar = () => { setEditandoId(null); setForm(EMPTY_FORM); setModalAberto(true) }
  const abrirEditar = (p: PacienteLocal) => {
    setEditandoId(p.id)
    setForm({ nome: p.nome, convenio: p.convenio, modalidade: p.modalidade, data_nascimento: p.data_nascimento ?? '', observacoes: p.observacoes ?? '' })
    setModalAberto(true)
  }

  const salvar = async () => {
    if (!form.nome.trim() || !form.convenio.trim()) return
    const payload = {
      nome: form.nome, convenio: form.convenio as 'Camperj' | 'Unimed',
      modalidade: form.modalidade, data_nascimento: form.data_nascimento || null,
      observacoes: form.observacoes || null,
    }
    try {
      if (editandoId) await apiClient.pacientes.editar(editandoId, payload)
      else await apiClient.pacientes.criar(payload)
      await fetchPacientes()
      setModalAberto(false); setArquivoForm(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      alert(`Erro ao salvar paciente: ${msg}`)
    }
  }

  const excluir = async (id: string, justificativa: string) => {
    try {
      await apiClient.pacientes.excluir(id, justificativa)
      await fetchPacientes()
    } catch (err) { console.error('Erro ao excluir:', err) }
    setConfirmDelete(null)
  }

  const desativar = async (id: string, justificativa: string) => {
    try {
      await apiClient.pacientes.desativar(id, {
        justificativa, motivo: justificativa, indicador: indicadorDesativar || undefined,
      })
      await fetchPacientes()
    } catch (err) { console.error('Erro ao desativar:', err) }
    setDesativarId(null); setIndicadorDesativar('')
  }

  const reativar = async (id: string) => {
    try {
      await apiClient.pacientes.reativar(id)
      await fetchPacientes()
    } catch (err) { console.error('Erro ao reativar:', err) }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={<Users size={20} />}
        iconClassName="bg-violet-500/15 text-violet-400"
        title="Pacientes"
        subtitle={`${pacientes.length} ${filtroStatus === 'ativo' ? 'ativos' : filtroStatus === 'inativo' ? 'inativos' : 'pacientes'} · ${todosConvenios.length} convênios`}
        actions={
          <button onClick={abrirCriar}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
            <Plus size={14} /> Novo Paciente
          </button>
        }
      />

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Filters */}
          <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 relative z-10">
            <div className="flex-1">
              <Combobox options={pacientes.map(p => ({ value: p.nome, label: p.nome, sublabel: p.convenio }))}
                value={busca} onChange={setBusca} placeholder="Buscar por nome..." emptyLabel="Todos os pacientes" />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <Combobox options={todosConvenios.map(c => ({ value: c, label: c }))}
                value={filtroConvenio === 'todos' ? '' : filtroConvenio}
                onChange={v => setFiltroConvenio(v || 'todos')}
                placeholder="Buscar convênio..." emptyLabel="Todos os convênios" />
            </div>
            <StatusFilter value={filtroStatus} onChange={setFiltroStatus}
              options={[{ value: 'ativo' as const, label: 'Ativos' }, { value: 'inativo' as const, label: 'Inativos' }, { value: 'todos' as const, label: 'Todos' }]} />
          </div>

          {/* Grouped list */}
          <div className="space-y-3">
            {agrupados.map(([convenio, lista], gi) => (
              <PacienteConvenioGroup key={convenio} convenio={convenio} lista={lista} index={gi}
                expanded={isExpanded(convenio)} onToggle={() => toggleGrupo(convenio)}
                onEdit={abrirEditar} onDelete={setConfirmDelete} onDesativar={setDesativarId} onReativar={reativar} />
            ))}
            {agrupados.length === 0 && (
              <EmptyState icon={<Users size={48} />} message="Nenhum paciente encontrado"
                hint="Tente ajustar os filtros ou adicione um novo paciente" />
            )}
          </div>
        </>
      )}

      {/* Form modal */}
      <PacienteFormModal open={modalAberto} editandoId={editandoId} form={form} arquivo={arquivoForm}
        onClose={() => setModalAberto(false)} onFormChange={setForm} onArquivoChange={setArquivoForm} onSave={salvar} />

      {/* Confirm delete */}
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={(just) => { if (confirmDelete) excluir(confirmDelete, just) }}
        title="Excluir paciente?" description="O paciente será removido das listagens. Esta ação pode ser revertida via audit log."
        confirmLabel="Excluir" variant="danger" placeholder="Motivo da exclusão..." />

      {/* Desativar */}
      <ConfirmDialog open={!!desativarId} onClose={() => { setDesativarId(null); setIndicadorDesativar('') }}
        onConfirm={(just) => { if (desativarId) desativar(desativarId, just) }}
        title="Desativar paciente" subtitle={pacientes.find(p => p.id === desativarId)?.nome}
        description="Desativar é diferente de excluir — o paciente permanece no sistema com histórico preservado, mas ficará inativo."
        icon={<div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center"><UserX size={20} className="text-amber-400" /></div>}
        confirmLabel="Desativar" variant="warning" placeholder="Motivo da desativação..." maxWidth="md">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Indicador vinculado <span className="text-[var(--color-text-muted)] opacity-60">(opcional)</span></span>
          <Combobox options={INDICADORES_DESATIVACAO.map(i => ({ value: i.codigo, label: `${i.codigo} — ${i.nome}` }))}
            value={indicadorDesativar} onChange={setIndicadorDesativar}
            placeholder="Buscar indicador..." emptyLabel="Nenhum" />
        </label>
      </ConfirmDialog>
    </div>
  )
}

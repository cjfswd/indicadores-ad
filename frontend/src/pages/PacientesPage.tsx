import { useState, useMemo, useEffect, useCallback } from 'react'
import { Users, Plus, X, Edit3, Trash2, Save, ChevronDown, ChevronRight, Loader2, UserX, UserCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { apiClient, type PacienteResponse } from '@/lib/api-client'
import { AnexoInput } from '@/components/AnexoInput'
import { Combobox } from '@/components/Combobox'

interface PacienteLocal {
  id: string
  nome: string
  convenio: string
  modalidade: 'AD' | 'ID'
  data_nascimento: string | null
  observacoes: string | null
  status: 'ativo' | 'inativo' | 'excluido'
  motivo_desativacao: string | null
  indicador_desativacao: string | null
}

const CONVENIOS = ['Camperj', 'Unimed'] as const

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

interface PacienteForm {
  nome: string
  convenio: string
  modalidade: 'AD' | 'ID'
  data_nascimento: string
  observacoes: string
}

const EMPTY_FORM: PacienteForm = { nome: '', convenio: '', modalidade: 'AD', data_nascimento: '', observacoes: '' }

const INDICADORES_DESATIVACAO = [
  { codigo: '01', nome: 'Alta Domiciliar' },
  { codigo: '03', nome: 'Internação Hospitalar' },
  { codigo: '04', nome: 'Óbito' },
] as const

export function PacientesPage() {
  const [pacientes, setPacientes] = useState<PacienteLocal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPacientes = useCallback(async () => {
    try {
      const data = await apiClient.pacientes.listar()
      setPacientes(data.dados.map((p: PacienteResponse) => ({
        id: p.id,
        nome: p.nome,
        convenio: p.convenio,
        modalidade: p.modalidade ?? 'AD',
        data_nascimento: p.data_nascimento,
        observacoes: p.observacoes,
        status: p.status,
        motivo_desativacao: p.motivo_desativacao,
        indicador_desativacao: p.indicador_desativacao,
      })))
    } catch {
      setPacientes(INITIAL_DATA)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPacientes() }, [fetchPacientes])
  const [busca, setBusca] = useState('')
  const [filtroConvenio, setFiltroConvenio] = useState<string>('todos')
  const [expandedConvenios, setExpandedConvenios] = useState<Set<string>>(new Set())

  // Modal state
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<PacienteForm>(EMPTY_FORM)
  const [arquivoForm, setArquivoForm] = useState<File | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [justificativaExcluir, setJustificativaExcluir] = useState('')
  const [arquivoExcluir, setArquivoExcluir] = useState<File | null>(null)

  // Deactivation modal state
  const [desativarId, setDesativarId] = useState<string | null>(null)
  const [justDesativar, setJustDesativar] = useState('')
  const [indicadorDesativar, setIndicadorDesativar] = useState('')
  const [arquivoDesativar, setArquivoDesativar] = useState<File | null>(null)

  // Filtered list
  const filtrados = useMemo(() => {
    return pacientes.filter(p => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.convenio.toLowerCase().includes(busca.toLowerCase())
      const matchConv = filtroConvenio === 'todos' || p.convenio === filtroConvenio
      return matchBusca && matchConv
    })
  }, [pacientes, busca, filtroConvenio])

  // Grouped by convênio
  const agrupados = useMemo(() => {
    const grupos = new Map<string, PacienteLocal[]>()
    for (const p of filtrados) {
      const list = grupos.get(p.convenio) ?? []
      list.push(p)
      grupos.set(p.convenio, list)
    }
    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtrados])

  // All unique convênios
  const todosConvenios = useMemo(() =>
    [...new Set(pacientes.map(p => p.convenio))].sort(),
  [pacientes])

  // Toggle expanded
  const toggleGrupo = (conv: string) => {
    setExpandedConvenios(prev => {
      const next = new Set(prev)
      if (next.has(conv)) next.delete(conv)
      else next.add(conv)
      return next
    })
  }

  // Expand all by default
  const isExpanded = (conv: string) => !expandedConvenios.has(conv)

  // CRUD
  const abrirCriar = () => {
    setEditandoId(null)
    setForm(EMPTY_FORM)
    setModalAberto(true)
  }

  const abrirEditar = (p: PacienteLocal) => {
    setEditandoId(p.id)
    setForm({
      nome: p.nome,
      convenio: p.convenio,
      modalidade: p.modalidade,
      data_nascimento: p.data_nascimento ?? '',
      observacoes: p.observacoes ?? '',
    })
    setModalAberto(true)
  }

  const salvar = async () => {
    if (!form.nome.trim() || !form.convenio.trim()) return

    const payload = {
      nome: form.nome,
      convenio: form.convenio as 'Camperj' | 'Unimed',
      modalidade: form.modalidade,
      data_nascimento: form.data_nascimento || null,
      observacoes: form.observacoes || null,
    }

    try {
      if (editandoId) {
        await apiClient.pacientes.editar(editandoId, payload)
      } else {
        await apiClient.pacientes.criar(payload)
      }
      await fetchPacientes()
      setModalAberto(false)
      setArquivoForm(null)
    } catch (err) {
      console.error('Erro ao salvar paciente:', err)
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      alert(`Erro ao salvar paciente: ${msg}`)
    }
  }

  const excluir = async (id: string) => {
    if (!justificativaExcluir.trim()) return
    try {
      await apiClient.pacientes.desativar(id, {
        justificativa: justificativaExcluir,
        motivo: justificativaExcluir,
      })
      await fetchPacientes()
    } catch (err) {
      console.error('Erro ao excluir paciente:', err)
    }
    setConfirmDelete(null)
    setJustificativaExcluir('')
    setArquivoExcluir(null)
  }

  const desativar = async (id: string) => {
    if (!justDesativar.trim()) return
    try {
      await apiClient.pacientes.desativar(id, {
        justificativa: justDesativar,
        motivo: justDesativar,
        indicador: indicadorDesativar || undefined,
      })
      await fetchPacientes()
    } catch (err) {
      console.error('Erro ao desativar paciente:', err)
    }
    setDesativarId(null); setJustDesativar(''); setIndicadorDesativar(''); setArquivoDesativar(null)
  }

  const reativar = async (id: string) => {
    try {
      await apiClient.pacientes.reativar(id)
      await fetchPacientes()
    } catch (err) {
      console.error('Erro ao reativar paciente:', err)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-md)] bg-violet-500/15 text-violet-400 flex items-center justify-center">
            <Users size={16} className="sm:hidden" />
            <Users size={20} className="hidden sm:block" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text-primary)]">Pacientes</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {pacientes.filter(p => p.status === 'ativo').length} ativos · {todosConvenios.length} convênios
            </p>
          </div>
        </div>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus size={14} /> Novo Paciente
        </button>
      </div>


      {/* Filtros */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 relative z-10">
        <div className="flex-1">
          <Combobox
            options={pacientes.map(p => ({ value: p.nome, label: p.nome, sublabel: p.convenio }))}
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome..."
            emptyLabel="Todos os pacientes"
          />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <Combobox
            options={todosConvenios.map(c => ({ value: c, label: c }))}
            value={filtroConvenio === 'todos' ? '' : filtroConvenio}
            onChange={v => setFiltroConvenio(v || 'todos')}
            placeholder="Buscar convênio..."
            emptyLabel="Todos os convênios"
          />
        </div>
      </div>

      {/* Lista agrupada por Convênio */}
      <div className="space-y-3">
        {agrupados.map(([convenio, lista], gi) => (
          <div key={convenio} className="animate-fade-in" style={{ animationDelay: `${gi * 50}ms` }}>
            {/* Grupo Header */}
            <button
              onClick={() => toggleGrupo(convenio)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-t-[var(--radius-lg)] bg-[var(--color-surface-1)] border border-[var(--color-border)] border-b-0 hover:bg-[var(--color-surface-2)]/50 transition-colors"
            >
              {isExpanded(convenio) ? <ChevronDown size={16} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={16} className="text-[var(--color-text-muted)]" />}
              <span className="text-sm font-semibold text-[var(--color-accent)]">{convenio}</span>
              <span className="text-xs text-[var(--color-text-muted)] ml-1">({lista.length})</span>
              <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                {lista.filter(p => p.status === 'ativo').length} ativos
              </span>
            </button>

            {/* Grupo Content */}
            {isExpanded(convenio) && (
              <div className="border border-[var(--color-border)] border-t-0 rounded-b-[var(--radius-lg)] overflow-hidden divide-y divide-white/5">
                {lista.map((p, i) => (
                  <div
                    key={p.id}
                    className={clsx(
                      'flex items-center justify-between px-4 py-3 animate-slide-in hover:bg-[var(--overlay-soft)] transition-colors',
                      p.status !== 'ativo' && 'opacity-50',
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-xs font-bold text-[var(--color-accent)] flex-shrink-0">
                        {p.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{p.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={clsx(
                            'px-1.5 py-0 rounded text-[10px] font-semibold',
                            p.modalidade === 'ID' ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400',
                          )}>
                            {p.modalidade}
                          </span>
                          {p.data_nascimento && (
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {calcularIdade(p.data_nascimento)} anos
                            </span>
                          )}
                          <span className={clsx(
                            'text-[10px] font-medium',
                            p.status === 'ativo' ? 'text-emerald-400' : 'text-red-400',
                          )}
                            title={p.status !== 'ativo' && p.motivo_desativacao ? `Motivo: ${p.motivo_desativacao}${p.indicador_desativacao ? ` (Ind. ${p.indicador_desativacao})` : ''}` : undefined}
                          >
                            {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                          {p.status !== 'ativo' && p.motivo_desativacao && (
                            <span className="text-[10px] text-red-400/60 truncate max-w-[120px]" title={p.motivo_desativacao}>
                              {p.motivo_desativacao}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {p.status === 'ativo' ? (
                        <button
                          onClick={() => setDesativarId(p.id)}
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          title="Desativar"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => reativar(p.id)}
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Reativar"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => abrirEditar(p)}
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--overlay-soft)] transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {agrupados.length === 0 && (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum paciente encontrado</p>
            <p className="text-xs mt-1">Tente ajustar os filtros ou adicione um novo paciente</p>
          </div>
        )}
      </div>

      {/* Modal — Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {editandoId ? 'Editar Paciente' : 'Novo Paciente'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Nome completo <span className="text-red-400">*</span></span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do paciente"
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                  autoFocus
                />
              </label>

              {/* Convênio */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Convênio <span className="text-red-400">*</span></span>
                <Combobox
                  options={CONVENIOS.map(c => ({ value: c, label: c }))}
                  value={form.convenio}
                  onChange={v => setForm(prev => ({ ...prev, convenio: v }))}
                  placeholder="Buscar convênio..."
                  emptyLabel="Selecione o convênio"
                />
              </label>

              {/* Modalidade + Data nascimento */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">Modalidade <span className="text-red-400">*</span></span>
                  <select
                    value={form.modalidade}
                    onChange={e => setForm(prev => ({ ...prev, modalidade: e.target.value as PacienteForm['modalidade'] }))}
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 cursor-pointer"
                  >
                    <option value="AD">AD</option>
                    <option value="ID">ID</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">Data de nascimento <span className="text-[var(--color-text-muted)] opacity-60">(opcional)</span></span>
                  <input
                    type="date"
                    value={form.data_nascimento}
                    onChange={e => setForm(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                  />
                </label>
              </div>

              {/* Observações */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Observações <span className="text-[var(--color-text-muted)] opacity-60">(opcional)</span></span>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações complementares..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 resize-none"
                />
              </label>

              <div>
                <AnexoInput arquivo={arquivoForm} onChange={setArquivoForm} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--overlay-border)]">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={!form.nome.trim() || !form.convenio.trim()}
                className={clsx(
                  'flex items-center gap-2 px-3 sm:px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  form.nome.trim() && form.convenio.trim()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                )}
              >
                <Save size={14} /> {editandoId ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Confirmar exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmDelete(null); setJustificativaExcluir(''); setArquivoExcluir(null) }} />
          <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">Excluir paciente?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Essa ação não pode ser desfeita. O paciente e todos os seus eventos serão removidos permanentemente.
            </p>
            <label className="flex flex-col gap-1.5 mb-4">
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Justificativa *</span>
              <textarea
                value={justificativaExcluir}
                onChange={e => setJustificativaExcluir(e.target.value)}
                placeholder="Motivo da exclusão..."
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
            </label>
            <div className="mb-4">
              <AnexoInput arquivo={arquivoExcluir} onChange={setArquivoExcluir} />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmDelete(null); setJustificativaExcluir(''); setArquivoExcluir(null) }}
                className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluir(confirmDelete)}
                disabled={!justificativaExcluir.trim()}
                className={clsx(
                  'px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  justificativaExcluir.trim() ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                )}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Desativar paciente */}
      {desativarId && (() => {
        const pac = pacientes.find(p => p.id === desativarId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setDesativarId(null); setJustDesativar(''); setIndicadorDesativar(''); setArquivoDesativar(null) }} />
            <div className="relative w-full max-w-md glass-card p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <UserX size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">Desativar paciente</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{pac?.nome}</p>
                </div>
              </div>

              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Desativar é diferente de excluir — o paciente permanece no sistema com histórico preservado, mas ficará inativo.
              </p>

              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">Justificativa <span className="text-red-400">*</span></span>
                  <textarea
                    value={justDesativar}
                    onChange={e => setJustDesativar(e.target.value)}
                    placeholder="Motivo da desativação..."
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-muted)] font-medium">Indicador vinculado <span className="text-[var(--color-text-muted)] opacity-60">(opcional)</span></span>
                  <Combobox
                    options={INDICADORES_DESATIVACAO.map(i => ({ value: i.codigo, label: `${i.codigo} — ${i.nome}` }))}
                    value={indicadorDesativar}
                    onChange={setIndicadorDesativar}
                    placeholder="Buscar indicador..."
                    emptyLabel="Nenhum"
                  />
                </label>

                <div>
                  <AnexoInput arquivo={arquivoDesativar} onChange={setArquivoDesativar} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--overlay-border)]">
                <button
                  onClick={() => { setDesativarId(null); setJustDesativar(''); setIndicadorDesativar(''); setArquivoDesativar(null) }}
                  className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--overlay-soft)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => desativar(desativarId)}
                  disabled={!justDesativar.trim()}
                  className={clsx(
                    'flex items-center gap-2 px-3 sm:px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                    justDesativar.trim() ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
                  )}
                >
                  <UserX size={14} /> Desativar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function calcularIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

import { useState, useEffect, useCallback } from 'react'
import { History, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { getEntitySummary, type AuditEntry } from '@/lib/audit-helpers'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Combobox } from '@/components/Combobox'
import { AuditEntryCard } from '@/components/auditoria/AuditEntryCard'

export function AuditoriaPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [filtroEntidade, setFiltroEntidade] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')
  const [confirmRevert, setConfirmRevert] = useState<AuditEntry | null>(null)

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.auditoria.listar({
        pagina, por_pagina: 20,
        entidade: filtroEntidade || undefined,
        acao: filtroAcao || undefined,
      })
      setEntries(data.dados as unknown as AuditEntry[])
      setTotalPaginas(data.paginacao.total_paginas)
      setTotal(data.paginacao.total_registros)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroEntidade, filtroAcao])

  useEffect(() => { fetchAudit() }, [fetchAudit])

  const handleRevert = async (entry: AuditEntry, justificativa: string, arquivo: File | null) => {
    try {
      const fd = new FormData()
      fd.append('justificativa', justificativa)
      if (arquivo) fd.append('arquivo', arquivo)
      await apiClient.auditoria.reverter(entry.id, fd)
      await fetchAudit()
    } catch (err) {
      console.error('Erro ao reverter:', err)
      alert('Erro ao reverter ação.')
    }
    setConfirmRevert(null)
  }

  const summary = confirmRevert ? getEntitySummary(confirmRevert) : null

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        icon={<History size={20} />}
        iconClassName="bg-cyan-500/15 text-cyan-400"
        title="Logs"
        subtitle={`Histórico de todas as alterações — ${total} registro${total !== 1 ? 's' : ''}`}
      />

      {/* Filters */}
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
            onChange={v => { setFiltroEntidade(v); setPagina(1) }}
            placeholder="Buscar entidade..." emptyLabel="Todas" />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[180px]">
          <span className="text-xs text-[var(--color-text-muted)] font-medium">Ação</span>
          <Combobox
            options={[
              { value: 'criar', label: 'Criar' }, { value: 'editar', label: 'Editar' },
              { value: 'confirmar', label: 'Confirmar' }, { value: 'excluir', label: 'Excluir / Reverter' },
              { value: 'desativar', label: 'Desativar' }, { value: 'reativar', label: 'Reativar' },
            ]}
            value={filtroAcao}
            onChange={v => { setFiltroAcao(v); setPagina(1) }}
            placeholder="Buscar ação..." emptyLabel="Todas" />
        </div>
        {(filtroEntidade || filtroAcao) && (
          <button onClick={() => { setFiltroEntidade(''); setFiltroAcao(''); setPagina(1) }}
            className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors">
            <X size={12} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? <LoadingSpinner /> : entries.length === 0 ? (
        <EmptyState icon={<History size={40} />} message="Nenhum registro de auditoria encontrado" />
      ) : (
        <div className="relative">
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <AuditEntryCard key={entry.id} entry={entry} index={i}
                onRevert={e => { setConfirmRevert(e) }} />
            ))}
          </div>
        </div>
      )}

      <Pagination pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />

      {/* Confirm revert dialog */}
      <ConfirmDialog
        open={!!confirmRevert}
        onClose={() => setConfirmRevert(null)}
        onConfirm={(just, arq) => { if (confirmRevert) handleRevert(confirmRevert, just, arq) }}
        title={summary?.title ?? 'Reverter?'}
        contextLines={summary?.lines}
        confirmLabel="Reverter"
        variant="warning"
        placeholder="Motivo da reversão..."
      />
    </div>
  )
}

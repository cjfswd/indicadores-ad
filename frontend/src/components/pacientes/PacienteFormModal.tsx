import { Save } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal } from '@/components/Modal'
import { FormField } from '@/components/FormField'
import { Combobox } from '@/components/Combobox'
import { AnexoInput } from '@/components/AnexoInput'

export interface PacienteForm {
  nome: string
  convenio: string
  modalidade: 'AD' | 'ID'
  data_nascimento: string
  observacoes: string
}

export const EMPTY_FORM: PacienteForm = { nome: '', convenio: '', modalidade: 'AD', data_nascimento: '', observacoes: '' }

const CONVENIOS = ['Camperj', 'Unimed'] as const

interface PacienteFormModalProps {
  open: boolean
  editandoId: string | null
  form: PacienteForm
  arquivo: File | null
  onClose: () => void
  onFormChange: (updater: (prev: PacienteForm) => PacienteForm) => void
  onArquivoChange: (file: File | null) => void
  onSave: () => void
}

export function PacienteFormModal({
  open, editandoId, form, arquivo,
  onClose, onFormChange, onArquivoChange, onSave,
}: PacienteFormModalProps) {
  const canSave = form.nome.trim() && form.convenio.trim()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editandoId ? 'Editar Paciente' : 'Novo Paciente'}
      maxWidth="lg"
      actions={
        <>
          <button onClick={onClose}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors">
            Cancelar
          </button>
          <button onClick={onSave} disabled={!canSave}
            className={clsx(
              'flex items-center gap-2 px-3 sm:px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
              canSave
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-[var(--color-surface-2)] text-[var(--color-surface-3)] cursor-not-allowed',
            )}>
            <Save size={14} /> {editandoId ? 'Salvar Alterações' : 'Cadastrar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Nome completo" required>
          <input type="text" value={form.nome}
            onChange={e => onFormChange(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome do paciente"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            autoFocus />
        </FormField>

        <FormField label="Convênio" required>
          <Combobox
            options={CONVENIOS.map(c => ({ value: c, label: c }))}
            value={form.convenio}
            onChange={v => onFormChange(prev => ({ ...prev, convenio: v }))}
            placeholder="Buscar convênio..."
            emptyLabel="Selecione o convênio" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Modalidade" required>
            <select value={form.modalidade}
              onChange={e => onFormChange(prev => ({ ...prev, modalidade: e.target.value as PacienteForm['modalidade'] }))}
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 cursor-pointer">
              <option value="AD">AD</option>
              <option value="ID">ID</option>
            </select>
          </FormField>
          <FormField label="Data de nascimento" hint="opcional">
            <input type="date" value={form.data_nascimento}
              onChange={e => onFormChange(prev => ({ ...prev, data_nascimento: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
          </FormField>
        </div>

        <FormField label="Observações" hint="opcional">
          <textarea value={form.observacoes}
            onChange={e => onFormChange(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Informações complementares..." rows={3}
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 resize-none" />
        </FormField>

        <AnexoInput arquivo={arquivo} onChange={onArquivoChange} />
      </div>
    </Modal>
  )
}

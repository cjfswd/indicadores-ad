import type { FC } from 'hono/jsx'
import { X } from '../components/Icons.js'
import { BACKDROP, MODAL, MODAL_HEADER, MODAL_FOOTER, BTN_PRIMARY, BTN_SECONDARY, BTN_GHOST, INPUT, SELECT, FIELD, LABEL } from '../ui.js'

interface Paciente { id: string; nome: string; convenio: string; modalidade: string; data_nascimento: string | null; observacoes: string | null }

export const PacienteForm: FC<{ paciente?: Paciente | null }> = ({ paciente }) => {
  const isEdit = !!paciente
  return (
    <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
      <div class={MODAL}>
        <div class={MODAL_HEADER}>
          <h3 class="text-lg font-semibold">{isEdit ? 'Editar Paciente' : 'Novo Paciente'}</h3>
          <button class={BTN_GHOST} hx-on:click="closeModal()"><X size={18} /></button>
        </div>
        <form {...(isEdit ? { 'hx-put': `/pacientes/${paciente!.id}` } : { 'hx-post': '/pacientes' })} hx-target="#pacientes-content" hx-swap="innerHTML">
          <div class="flex flex-col gap-4 mb-4">
            <div class={FIELD}>
              <label class={LABEL}>Nome completo <span class="text-red-500">*</span></label>
              <input type="text" name="nome" class={INPUT} required minlength={3} maxlength={200} placeholder="Nome do paciente" value={paciente?.nome ?? ''} />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class={FIELD}>
                <label class={LABEL}>Convênio <span class="text-red-500">*</span></label>
                <select name="convenio" class={SELECT} required>
                  <option value="Camperj" selected={paciente?.convenio === 'Camperj'}>Camperj</option>
                  <option value="Unimed" selected={paciente?.convenio === 'Unimed'}>Unimed</option>
                </select>
              </div>
              <div class={FIELD}>
                <label class={LABEL}>Modalidade <span class="text-red-500">*</span></label>
                <select name="modalidade" class={SELECT} required>
                  <option value="AD" selected={paciente?.modalidade === 'AD'}>AD</option>
                  <option value="ID" selected={paciente?.modalidade === 'ID'}>ID</option>
                </select>
              </div>
            </div>
            <div class={FIELD}>
              <label class={LABEL}>Data de nascimento</label>
              <input type="date" name="data_nascimento" class={INPUT} value={paciente?.data_nascimento ?? ''} />
            </div>
            <div class={FIELD}>
              <label class={LABEL}>Observações</label>
              <textarea name="observacoes" class={`${INPUT} resize-y min-h-20`} placeholder="Informações complementares..." rows={3}>{paciente?.observacoes ?? ''}</textarea>
            </div>
          </div>
          <div class={MODAL_FOOTER}>
            <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
            <button type="submit" class={BTN_PRIMARY}>{isEdit ? 'Salvar Alterações' : 'Cadastrar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

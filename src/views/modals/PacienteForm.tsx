import type { FC } from 'hono/jsx'

interface Paciente { id: string; nome: string; convenio: string; modalidade: string; data_nascimento: string | null; observacoes: string | null }

export const PacienteForm: FC<{ paciente?: Paciente | null }> = ({ paciente }) => {
  const isEdit = !!paciente
  return (
    <div class="modal-backdrop" hx-on:click="if(event.target===this)closeModal()">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{isEdit ? 'Editar Paciente' : 'Novo Paciente'}</h3>
          <button class="btn btn-ghost btn-icon" hx-on:click="closeModal()">×</button>
        </div>
        <form {...(isEdit ? { 'hx-put': `/pacientes/${paciente!.id}` } : { 'hx-post': '/pacientes' })} hx-target="#pacientes-content" hx-swap="innerHTML">
          <div class="space-y-4" style="margin-bottom:1rem">
            <div class="form-group">
              <label class="form-label">Nome completo <span style="color:#ef4444">*</span></label>
              <input type="text" name="nome" class="form-input" required minlength={3} maxlength={200} placeholder="Nome do paciente" value={paciente?.nome ?? ''} />
            </div>
            <div class="grid grid-2 gap-3">
              <div class="form-group">
                <label class="form-label">Convênio <span style="color:#ef4444">*</span></label>
                <select name="convenio" class="form-select" required>
                  <option value="Camperj" selected={paciente?.convenio === 'Camperj'}>Camperj</option>
                  <option value="Unimed" selected={paciente?.convenio === 'Unimed'}>Unimed</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Modalidade <span style="color:#ef4444">*</span></label>
                <select name="modalidade" class="form-select" required>
                  <option value="AD" selected={paciente?.modalidade === 'AD'}>AD</option>
                  <option value="ID" selected={paciente?.modalidade === 'ID'}>ID</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Data de nascimento</label>
              <input type="date" name="data_nascimento" class="form-input" value={paciente?.data_nascimento ?? ''} />
            </div>
            <div class="form-group">
              <label class="form-label">Observações</label>
              <textarea name="observacoes" class="form-textarea" placeholder="Informações complementares..." rows={3}>{paciente?.observacoes ?? ''}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" hx-on:click="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">{isEdit ? 'Salvar Alterações' : 'Cadastrar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

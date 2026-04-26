import type { FC } from 'hono/jsx'

export const PacienteDesativar: FC<{ id: string; nome: string }> = ({ id, nome }) => (
  <div class="modal-backdrop" hx-on:click="if(event.target===this)closeModal()">
    <div class="modal-content" style="max-width:28rem">
      <h3 style="margin-bottom:.5rem">Desativar paciente</h3>
      <p style="font-size:.875rem;color:var(--color-accent);margin-bottom:.75rem">{nome}</p>
      <p style="font-size:.875rem;color:var(--color-text-muted);margin-bottom:1rem">Desativar é diferente de excluir — o paciente permanece no sistema com histórico preservado, mas ficará inativo.</p>
      <form hx-put={`/pacientes/${id}/desativar`} hx-target="#pacientes-content" hx-swap="innerHTML">
        <div class="space-y-4" style="margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Justificativa <span style="color:#ef4444">*</span></label>
            <textarea name="justificativa" class="form-textarea" placeholder="Motivo da desativação..." rows={3} required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Indicador vinculado</label>
            <select name="indicador" class="form-select">
              <option value="">Nenhum</option>
              <option value="01">01 — Alta Domiciliar</option>
              <option value="03">03 — Internação Hospitalar</option>
              <option value="04">04 — Óbito</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class="btn" style="background:#d97706;color:white">Desativar</button>
        </div>
      </form>
    </div>
  </div>
)

export const PacienteExcluir: FC<{ id: string }> = ({ id }) => (
  <div class="modal-backdrop" hx-on:click="if(event.target===this)closeModal()">
    <div class="modal-content" style="max-width:24rem">
      <h3 style="margin-bottom:.5rem">Excluir paciente?</h3>
      <p style="font-size:.875rem;color:var(--color-text-muted);margin-bottom:1rem">O paciente será removido das listagens. Esta ação pode ser revertida via audit log.</p>
      <form hx-post={`/pacientes/${id}/excluir`} hx-target="#pacientes-content" hx-swap="innerHTML">
        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Justificativa *</label>
          <textarea name="justificativa" class="form-textarea" placeholder="Motivo da exclusão..." rows={3} required></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class="btn" style="background:#dc2626;color:white">Excluir</button>
        </div>
      </form>
    </div>
  </div>
)

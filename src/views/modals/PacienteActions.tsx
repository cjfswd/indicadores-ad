import type { FC } from 'hono/jsx'
import { UserX } from '../components/Icons.js'
import { BACKDROP, MODAL, MODAL_FOOTER, BTN, BTN_SECONDARY, INPUT, SELECT, FIELD, LABEL } from '../ui.js'

export const PacienteDesativar: FC<{ id: string; nome: string }> = ({ id, nome }) => (
  <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
    <div class={`${MODAL} !max-w-md`}>
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
          <UserX size={20} class="text-amber-400" />
        </div>
        <div>
          <h3 class="text-base font-bold text-(--color-text-primary)">Desativar paciente</h3>
          <p class="text-xs text-(--color-text-muted)">{nome}</p>
        </div>
      </div>
      <p class="text-sm text-(--color-text-muted) mb-4">Desativar é diferente de excluir — o paciente permanece no sistema com histórico preservado, mas ficará inativo.</p>
      <form hx-put={`/pacientes/${id}/desativar`} hx-target="#pacientes-content" hx-swap="innerHTML">
        <div class="flex flex-col gap-4 mb-4">
          <div class={FIELD}>
            <label class={LABEL}>Justificativa <span class="text-red-500">*</span></label>
            <textarea name="justificativa" class={`${INPUT} resize-y min-h-20`} placeholder="Motivo da desativação..." rows={3} required></textarea>
          </div>
          <div class={FIELD}>
            <label class={LABEL}>Indicador vinculado</label>
            <select name="indicador" class={SELECT}>
              <option value="">Nenhum</option>
              <option value="01">01 — Alta Domiciliar</option>
              <option value="03">03 — Internação Hospitalar</option>
              <option value="04">04 — Óbito</option>
            </select>
          </div>
        </div>
        <div class={MODAL_FOOTER}>
          <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class={`${BTN} bg-amber-600 text-white`}><UserX size={14} /> Desativar</button>
        </div>
      </form>
    </div>
  </div>
)

export const PacienteExcluir: FC<{ id: string }> = ({ id }) => (
  <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
    <div class={`${MODAL} !max-w-sm`}>
      <h3 class="mb-2 text-lg font-semibold">Excluir paciente?</h3>
      <p class="text-sm text-(--color-text-muted) mb-4">O paciente será removido das listagens. Esta ação pode ser revertida via audit log.</p>
      <form hx-post={`/pacientes/${id}/excluir`} hx-target="#pacientes-content" hx-swap="innerHTML">
        <div class={`${FIELD} mb-4`}>
          <label class={LABEL}>Justificativa *</label>
          <textarea name="justificativa" class={`${INPUT} resize-y min-h-20`} placeholder="Motivo da exclusão..." rows={3} required></textarea>
        </div>
        <div class={MODAL_FOOTER}>
          <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class={`${BTN} bg-red-600 text-white`}>Excluir</button>
        </div>
      </form>
    </div>
  </div>
)

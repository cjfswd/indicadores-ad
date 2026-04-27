import type { FC } from 'hono/jsx'
import { X } from '../components/Icons.js'
import { BACKDROP, MODAL, MODAL_HEADER, MODAL_FOOTER, BTN_PRIMARY, BTN_SECONDARY, BTN_GHOST, INPUT, SELECT, FIELD, LABEL } from '../ui.js'

interface Paciente { id: string; nome: string; convenio: string; modalidade: string }

export const EventoForm: FC<{ tipoEvento: string; label: string; ano: number; mes: number; pacientes: Paciente[] }> = ({ tipoEvento, label, ano, mes, pacientes }) => (
  <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
    <div class={MODAL}>
      <div class={MODAL_HEADER}>
        <div>
          <h3 class="text-lg font-semibold">Registrar Evento</h3>
          <p class="text-sm text-(--color-accent) font-medium mt-1">{label}</p>
        </div>
        <button class={BTN_GHOST} hx-on:click="closeModal()"><X size={18} /></button>
      </div>
      <form hx-post="/registros/eventos" hx-target="#registro-content" hx-swap="innerHTML">
        <input type="hidden" name="tipo_evento" value={tipoEvento} />
        <input type="hidden" name="ano" value={String(ano)} />
        <input type="hidden" name="mes" value={String(mes)} />
        <div class="flex flex-col gap-4 mb-4">
          <div class={FIELD}>
            <label class={LABEL}>Paciente *</label>
            <select name="paciente_id" class={SELECT} required>
              <option value="">Selecione...</option>
              {pacientes.map(p => <option value={p.id}>{p.nome} ({p.convenio} · {p.modalidade})</option>)}
            </select>
          </div>
          <div class={FIELD}>
            <label class={LABEL}>Data do evento</label>
            <input type="date" name="data_evento" class={INPUT} value={new Date().toISOString().slice(0, 10)} />
          </div>
          <div class={FIELD}>
            <label class={LABEL}>Descrição / Observação</label>
            <textarea name="descricao" class={`${INPUT} resize-y min-h-20`} placeholder="Detalhes do evento..." rows={3}></textarea>
          </div>
        </div>
        <div class={MODAL_FOOTER}>
          <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class={BTN_PRIMARY}>Registrar Evento</button>
        </div>
      </form>
    </div>
  </div>
)

export const EventoExcluir: FC<{ id: string }> = ({ id }) => (
  <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
    <div class={`${MODAL} !max-w-sm`}>
      <h3 class="mb-2 text-lg font-semibold">Remover evento?</h3>
      <p class="text-sm text-(--color-text-muted) mb-4">O contador será decrementado e o evento será removido.</p>
      <form hx-post={`/registros/eventos/${id}/reverter`} hx-target="#registro-content" hx-swap="innerHTML">
        <div class={`${FIELD} mb-4`}>
          <label class={LABEL}>Justificativa *</label>
          <textarea name="justificativa" class={`${INPUT} resize-y min-h-20`} placeholder="Motivo da remoção do evento..." rows={3} required></textarea>
        </div>
        <div class={MODAL_FOOTER}>
          <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border border-transparent transition-all duration-150 whitespace-nowrap bg-red-600 text-white">Remover</button>
        </div>
      </form>
    </div>
  </div>
)

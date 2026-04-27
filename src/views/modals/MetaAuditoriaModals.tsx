import type { FC } from 'hono/jsx'
import { INDICADOR_LABELS, MESES_CURTOS, ENTIDADE_LABELS } from '../helpers.js'
import { X, Undo2 } from '../components/Icons.js'
import { BACKDROP, MODAL, MODAL_HEADER, MODAL_FOOTER, BTN, BTN_PRIMARY, BTN_SECONDARY, BTN_GHOST, INPUT, SELECT, FIELD, LABEL } from '../ui.js'

interface Meta { indicador_codigo: string; meta_valor: number | null; limite_alerta: number | null; sentido: string; mes_inicio: number | null; mes_fim: number | null }

export const MetaForm: FC<{ meta?: Meta | null; ano: number }> = ({ meta, ano }) => {
  const isEdit = !!meta
  return (
    <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
      <div class={MODAL}>
        <div class={MODAL_HEADER}>
          <h3 class="text-lg font-semibold">{isEdit ? 'Editar Meta' : 'Definir Meta'}</h3>
          <button class={BTN_GHOST} hx-on:click="closeModal()"><X size={18} /></button>
        </div>
        <form hx-put="/metas" hx-target="#metas-content" hx-swap="innerHTML">
          <input type="hidden" name="ano" value={String(ano)} />
          <div class="flex flex-col gap-4 mb-4">
            <div class={FIELD}>
              <label class={LABEL}>Indicador</label>
              <select name="indicador_codigo" class={SELECT} required>
                {Object.entries(INDICADOR_LABELS).map(([codigo, nome]) => (
                  <option value={codigo} selected={isEdit && meta!.indicador_codigo === codigo}>{codigo} — {nome}</option>
                ))}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class={FIELD}>
                <label class={LABEL}>Meta</label>
                <input type="number" name="meta_valor" class={INPUT} step="0.01" placeholder="Valor da meta" value={isEdit && meta!.meta_valor != null ? String(meta!.meta_valor) : ''} />
              </div>
              <div class={FIELD}>
                <label class={LABEL}>Limite de Alerta</label>
                <input type="number" name="limite_alerta" class={INPUT} step="0.01" placeholder="Valor de alerta" value={isEdit && meta!.limite_alerta != null ? String(meta!.limite_alerta) : ''} />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class={FIELD}>
                <label class={LABEL}>Sentido</label>
                <select name="sentido" class={SELECT}>
                  <option value="menor" selected={isEdit && meta!.sentido === 'menor'}>Menor melhor</option>
                  <option value="maior" selected={isEdit && meta!.sentido === 'maior'}>Maior melhor</option>
                  <option value="neutro" selected={isEdit && meta!.sentido === 'neutro'}>Neutro</option>
                </select>
              </div>
              <div class={FIELD}>
                <label class={LABEL}>Mês início</label>
                <select name="mes_inicio" class={SELECT}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option value={m} selected={isEdit ? meta!.mes_inicio === m : m === 1}>{MESES_CURTOS[m]}</option>)}
                </select>
              </div>
              <div class={FIELD}>
                <label class={LABEL}>Mês fim</label>
                <select name="mes_fim" class={SELECT}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option value={m} selected={isEdit ? meta!.mes_fim === m : m === 12}>{MESES_CURTOS[m]}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div class={MODAL_FOOTER}>
            <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
            <button type="submit" class={BTN_PRIMARY}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const AuditoriaReverter: FC<{ id: string; acao: string; entidade: string }> = ({ id, acao, entidade }) => (
  <div class={BACKDROP} hx-on:click="if(event.target===this)closeModal()">
    <div class={`${MODAL} !max-w-sm`}>
      <h3 class="mb-3 text-lg font-semibold">Reverter {acao} de {ENTIDADE_LABELS[entidade] ?? entidade}?</h3>
      <form hx-post={`/auditoria/${id}/reverter`} hx-target="#auditoria-content" hx-swap="innerHTML">
        <div class={`${FIELD} mb-4`}>
          <label class={LABEL}>Justificativa *</label>
          <textarea name="justificativa" class={`${INPUT} resize-y min-h-20`} placeholder="Motivo da reversão..." rows={3} required></textarea>
        </div>
        <div class={MODAL_FOOTER}>
          <button type="button" class={BTN_SECONDARY} hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class={`${BTN} bg-amber-600 text-white`}><Undo2 size={14} /> Reverter</button>
        </div>
      </form>
    </div>
  </div>
)

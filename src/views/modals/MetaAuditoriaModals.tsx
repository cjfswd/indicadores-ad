import type { FC } from 'hono/jsx'
import { INDICADOR_LABELS, MESES_CURTOS, ENTIDADE_LABELS } from '../helpers.js'

interface Meta { indicador_codigo: string; meta_valor: number | null; limite_alerta: number | null; sentido: string; mes_inicio: number | null; mes_fim: number | null }

export const MetaForm: FC<{ meta?: Meta | null; ano: number }> = ({ meta, ano }) => {
  const isEdit = !!meta
  return (
    <div class="modal-backdrop" hx-on:click="if(event.target===this)closeModal()">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{isEdit ? 'Editar Meta' : 'Definir Meta'}</h3>
          <button class="btn btn-ghost btn-icon" hx-on:click="closeModal()">×</button>
        </div>
        <form hx-put="/metas" hx-target="#metas-content" hx-swap="innerHTML">
          <input type="hidden" name="ano" value={String(ano)} />
          <div class="space-y-4" style="margin-bottom:1rem">
            <div class="form-group">
              <label class="form-label">Indicador</label>
              <select name="indicador_codigo" class="form-select" required>
                {Object.entries(INDICADOR_LABELS).map(([codigo, nome]) => (
                  <option value={codigo} selected={isEdit && meta!.indicador_codigo === codigo}>{codigo} — {nome}</option>
                ))}
              </select>
            </div>
            <div class="grid grid-2 gap-3">
              <div class="form-group">
                <label class="form-label">Meta</label>
                <input type="number" name="meta_valor" class="form-input" step="0.01" placeholder="Valor da meta" value={isEdit && meta!.meta_valor != null ? String(meta!.meta_valor) : ''} />
              </div>
              <div class="form-group">
                <label class="form-label">Limite de Alerta</label>
                <input type="number" name="limite_alerta" class="form-input" step="0.01" placeholder="Valor de alerta" value={isEdit && meta!.limite_alerta != null ? String(meta!.limite_alerta) : ''} />
              </div>
            </div>
            <div class="grid grid-3 gap-3">
              <div class="form-group">
                <label class="form-label">Sentido</label>
                <select name="sentido" class="form-select">
                  <option value="menor" selected={isEdit && meta!.sentido === 'menor'}>↓ Menor melhor</option>
                  <option value="maior" selected={isEdit && meta!.sentido === 'maior'}>↑ Maior melhor</option>
                  <option value="neutro" selected={isEdit && meta!.sentido === 'neutro'}>→ Neutro</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Mês início</label>
                <select name="mes_inicio" class="form-select">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option value={m} selected={isEdit ? meta!.mes_inicio === m : m === 1}>{MESES_CURTOS[m]}</option>)}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Mês fim</label>
                <select name="mes_fim" class="form-select">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option value={m} selected={isEdit ? meta!.mes_fim === m : m === 12}>{MESES_CURTOS[m]}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" hx-on:click="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const AuditoriaReverter: FC<{ id: string; acao: string; entidade: string }> = ({ id, acao, entidade }) => (
  <div class="modal-backdrop" hx-on:click="if(event.target===this)closeModal()">
    <div class="modal-content" style="max-width:24rem">
      <h3 style="margin-bottom:.75rem">Reverter {acao} de {ENTIDADE_LABELS[entidade] ?? entidade}?</h3>
      <form hx-post={`/auditoria/${id}/reverter`} hx-target="#auditoria-content" hx-swap="innerHTML">
        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Justificativa *</label>
          <textarea name="justificativa" class="form-textarea" placeholder="Motivo da reversão..." rows={3} required></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" hx-on:click="closeModal()">Cancelar</button>
          <button type="submit" class="btn" style="background:#d97706;color:white">↺ Reverter</button>
        </div>
      </form>
    </div>
  </div>
)

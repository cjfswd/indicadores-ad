import type { FC } from 'hono/jsx'
import { MESES } from '../helpers.js'
import { ClipboardList } from '../components/Icons.js'
import { PageHeader } from '../components/PageHeader.js'
import { PAGE, CARD_SM, SELECT } from '../ui.js'

export const RegistrosPage: FC = () => {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  return (
    <div class={PAGE}>
      <PageHeader
        icon={<ClipboardList size={20} />}
        iconClass="bg-emerald-500/15 text-emerald-400"
        title="Registros Mensais"
        subtitle="Registro de indicadores e eventos por período"
      />
      <div class={CARD_SM}>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide">Período</span>
          <select class={SELECT} name="regMes" hx-get="/registros/content" hx-target="#registro-content" hx-include="[name='regAno']" hx-swap="innerHTML">
            {MESES.map((m, i) => i > 0 ? <option value={i} selected={i === mesAtual}>{m}</option> : null)}
          </select>
          <select class={SELECT} name="regAno" hx-get="/registros/content" hx-target="#registro-content" hx-include="[name='regMes']" hx-swap="innerHTML">
            {[2025, 2026, 2027].map(y => <option value={y} selected={y === anoAtual}>{y}</option>)}
          </select>
        </div>
      </div>
      <div id="registro-content" hx-get="/registros/content" hx-trigger="load" hx-swap="innerHTML">
        <div class="text-center py-16 text-(--color-text-muted)">Carregando...</div>
      </div>
    </div>
  )
}

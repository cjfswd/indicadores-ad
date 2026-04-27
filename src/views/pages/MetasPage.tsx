import type { FC } from 'hono/jsx'
import { Target, Plus } from '../components/Icons.js'
import { PageHeader } from '../components/PageHeader.js'
import { PAGE, SELECT, BTN_PRIMARY } from '../ui.js'

export const MetasPage: FC = () => {
  const anoAtual = new Date().getFullYear()
  return (
    <div class={PAGE}>
      <PageHeader
        icon={<Target size={20} />}
        iconClass="bg-amber-500/15 text-amber-300"
        title="Metas"
        subtitle="Configuração de metas e limites de alerta por indicador"
        actions={
          <>
            <select class={SELECT} name="metasAno" hx-get="/metas/content" hx-target="#metas-content" hx-swap="innerHTML">
              {[2025, 2026, 2027].map(y => <option value={y} selected={y === anoAtual}>{y}</option>)}
            </select>
            <button class={BTN_PRIMARY} hx-get="/metas/modal/editar" hx-target="#modal-container" hx-swap="innerHTML">
              <Plus size={14} /> Definir Meta
            </button>
          </>
        }
      />
      <div id="metas-content" hx-get="/metas/content" hx-trigger="load" hx-swap="innerHTML">
        <div class="text-center py-16 text-(--color-text-muted)">Carregando...</div>
      </div>
    </div>
  )
}

import type { FC } from 'hono/jsx'
import { Users, Plus } from '../components/Icons.js'
import { PageHeader } from '../components/PageHeader.js'
import { PAGE, CARD_SM, SELECT, BTN_PRIMARY, BTN_SM } from '../ui.js'

export const PacientesPage: FC = () => (
  <div class={PAGE}>
    <PageHeader
      icon={<Users size={20} />}
      iconClass="bg-purple-500/15 text-purple-400"
      title="Pacientes"
      subtitle="Gestão de pacientes em atenção domiciliar"
      actions={
        <button class={BTN_PRIMARY} hx-get="/pacientes/modal/novo" hx-target="#modal-container" hx-swap="innerHTML">
          <Plus size={14} /> Novo Paciente
        </button>
      }
    />
    <div class={CARD_SM}>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex gap-1">
          <button class={`${BTN_SM} bg-(--color-accent) text-white`} hx-get="/pacientes/content?filtroStatus=ativo" hx-target="#pacientes-content" hx-swap="innerHTML" hx-on__before-request="this.parentElement.querySelectorAll('button').forEach(b=>{b.classList.remove('bg-(--color-accent)','text-white');b.classList.add('bg-transparent','text-(--color-text-secondary)')});this.classList.remove('bg-transparent','text-(--color-text-secondary)');this.classList.add('bg-(--color-accent)','text-white')">Ativos</button>
          <button class={`${BTN_SM} bg-transparent text-(--color-text-secondary)`} hx-get="/pacientes/content?filtroStatus=inativo" hx-target="#pacientes-content" hx-swap="innerHTML" hx-on__before-request="this.parentElement.querySelectorAll('button').forEach(b=>{b.classList.remove('bg-(--color-accent)','text-white');b.classList.add('bg-transparent','text-(--color-text-secondary)')});this.classList.remove('bg-transparent','text-(--color-text-secondary)');this.classList.add('bg-(--color-accent)','text-white')">Inativos</button>
          <button class={`${BTN_SM} bg-transparent text-(--color-text-secondary)`} hx-get="/pacientes/content?filtroStatus=todos" hx-target="#pacientes-content" hx-swap="innerHTML" hx-on__before-request="this.parentElement.querySelectorAll('button').forEach(b=>{b.classList.remove('bg-(--color-accent)','text-white');b.classList.add('bg-transparent','text-(--color-text-secondary)')});this.classList.remove('bg-transparent','text-(--color-text-secondary)');this.classList.add('bg-(--color-accent)','text-white')">Todos</button>
        </div>
        <input type="search" name="busca" class={`${SELECT} !w-full max-w-60`} placeholder="Buscar paciente..." hx-get="/pacientes/content" hx-target="#pacientes-content" hx-swap="innerHTML" hx-trigger="input changed delay:300ms" hx-include="[name='filtroConvenio']" />
        <select name="filtroConvenio" class={SELECT} hx-get="/pacientes/content" hx-target="#pacientes-content" hx-swap="innerHTML" hx-trigger="change" hx-include="[name='busca']">
          <option value="todos">Todos Convênios</option>
          <option value="Camperj">Camperj</option>
          <option value="Unimed">Unimed</option>
        </select>
      </div>
    </div>
    <div id="pacientes-content" hx-get="/pacientes/content" hx-trigger="load" hx-swap="innerHTML">
      <div class="text-center py-16 text-(--color-text-muted)">Carregando...</div>
    </div>
  </div>
)

import type { FC } from 'hono/jsx'
import { History, X } from '../components/Icons.js'
import { PageHeader } from '../components/PageHeader.js'
import { PAGE, CARD_SM, SELECT, BTN_SM } from '../ui.js'

export const AuditoriaPage: FC = () => (
  <div class={PAGE}>
    <PageHeader
      icon={<History size={20} />}
      iconClass="bg-cyan-500/15 text-cyan-300"
      title="Logs"
      subtitle="Histórico de todas as alterações"
    />
    <div class={CARD_SM}>
      <div class="flex items-center gap-3 flex-wrap">
        <div>
          <label class="text-xs text-(--color-text-muted)">Entidade</label>
          <select class={SELECT} name="filtroEntidade" hx-get="/auditoria/content" hx-target="#auditoria-content" hx-swap="innerHTML" hx-include="[name='filtroAcao']">
            <option value="">Todas</option>
            <option value="paciente">Paciente</option>
            <option value="evento_paciente">Evento Clínico</option>
            <option value="registro_mensal">Registro Mensal</option>
            <option value="meta">Meta</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-(--color-text-muted)">Ação</label>
          <select class={SELECT} name="filtroAcao" hx-get="/auditoria/content" hx-target="#auditoria-content" hx-swap="innerHTML" hx-include="[name='filtroEntidade']">
            <option value="">Todas</option>
            <option value="criar">Criar</option>
            <option value="editar">Editar</option>
            <option value="excluir">Excluir</option>
            <option value="confirmar">Confirmar</option>
            <option value="desativar">Desativar</option>
            <option value="reativar">Reativar</option>
            <option value="reverter">Reverter</option>
            <option value="reverter_criacao">Reverter criação</option>
            <option value="reverter_exclusao">Reverter exclusão</option>
            <option value="reverter_edicao">Reverter edição</option>
            <option value="reverter_confirmacao">Reverter confirmação</option>
            <option value="reverter_desativacao">Reverter desativação</option>
            <option value="reverter_reativacao">Reverter reativação</option>
          </select>
        </div>
        <button class={`${BTN_SM} border-(--color-border) bg-(--color-surface-2) text-(--color-text-primary) hover:bg-(--color-surface-3)`} hx-get="/auditoria/content" hx-target="#auditoria-content" hx-swap="innerHTML">
          <X size={12} /> Limpar filtros
        </button>
      </div>
    </div>
    <div id="auditoria-content" hx-get="/auditoria/content" hx-trigger="load" hx-swap="innerHTML">
      <div class="text-center py-16 text-(--color-text-muted)">Carregando...</div>
    </div>
  </div>
)

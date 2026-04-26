import type { FC } from 'hono/jsx'

export const AuditoriaPage: FC = () => (
  <div>
    <div class="page-header">
      <div class="flex items-center gap-3">
        <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(6,182,212,.15);color:#22d3ee;display:flex;align-items:center;justify-content:center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5" /><path d="M3 8a9 9 0 0 1 18 0 9 9 0 0 1-18 0" /></svg>
        </div>
        <div><h2>Logs</h2><p>Histórico de todas as alterações</p></div>
      </div>
    </div>
    <div class="glass-card no-hover" style="padding:.75rem 1rem;margin-bottom:1rem">
      <div class="flex items-center gap-3" style="flex-wrap:wrap">
        <div>
          <label style="font-size:.75rem;color:var(--color-text-muted)">Entidade</label>
          <select class="form-select" name="filtroEntidade" style="width:auto" hx-get="/auditoria/content" hx-target="#auditoria-content" hx-swap="innerHTML" hx-include="[name='filtroAcao']">
            <option value="">Todas</option>
            <option value="paciente">Paciente</option>
            <option value="evento_paciente">Evento Clínico</option>
            <option value="registro_mensal">Registro Mensal</option>
            <option value="meta">Meta</option>
          </select>
        </div>
        <div>
          <label style="font-size:.75rem;color:var(--color-text-muted)">Ação</label>
          <select class="form-select" name="filtroAcao" style="width:auto" hx-get="/auditoria/content" hx-target="#auditoria-content" hx-swap="innerHTML" hx-include="[name='filtroEntidade']">
            <option value="">Todas</option>
            <option value="criar">Criar</option>
            <option value="editar">Editar</option>
            <option value="excluir">Excluir</option>
            <option value="confirmar">Confirmar</option>
            <option value="desativar">Desativar</option>
            <option value="reativar">Reativar</option>
          </select>
        </div>
        <button class="btn btn-sm" hx-get="/auditoria/content" hx-target="#auditoria-content" hx-swap="innerHTML">✕ Limpar filtros</button>
      </div>
    </div>
    <div id="auditoria-content" hx-get="/auditoria/content" hx-trigger="load" hx-swap="innerHTML">
      <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">Carregando...</div>
    </div>
  </div>
)

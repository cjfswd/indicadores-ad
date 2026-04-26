import type { FC } from 'hono/jsx'

export const PacientesPage: FC = () => (
  <div>
    <div class="page-header">
      <div class="flex items-center gap-3">
        <div style="width:2.5rem;height:2.5rem;border-radius:var(--radius-md);background:rgba(139,92,246,.15);color:#a78bfa;display:flex;align-items:center;justify-content:center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
        </div>
        <div><h2>Pacientes</h2><p>Gestão de pacientes em atenção domiciliar</p></div>
      </div>
      <button class="btn btn-primary" hx-get="/pacientes/modal/novo" hx-target="#modal-container" hx-swap="innerHTML">+ Novo Paciente</button>
    </div>
    <div class="glass-card no-hover" style="padding:.75rem 1rem;margin-bottom:1rem">
      <div class="flex items-center gap-3" style="flex-wrap:wrap">
        <div class="flex gap-1">
          <button class="btn btn-sm btn-primary" hx-get="/pacientes/content?filtroStatus=ativo" hx-target="#pacientes-content" hx-swap="innerHTML" hx-on__before-request="this.parentElement.querySelectorAll('.btn').forEach(b=>b.classList.remove('btn-primary'));this.classList.add('btn-primary')">Ativos</button>
          <button class="btn btn-sm" hx-get="/pacientes/content?filtroStatus=inativo" hx-target="#pacientes-content" hx-swap="innerHTML" hx-on__before-request="this.parentElement.querySelectorAll('.btn').forEach(b=>b.classList.remove('btn-primary'));this.classList.add('btn-primary')">Inativos</button>
          <button class="btn btn-sm" hx-get="/pacientes/content?filtroStatus=todos" hx-target="#pacientes-content" hx-swap="innerHTML" hx-on__before-request="this.parentElement.querySelectorAll('.btn').forEach(b=>b.classList.remove('btn-primary'));this.classList.add('btn-primary')">Todos</button>
        </div>
        <input type="search" name="busca" class="form-input" placeholder="Buscar paciente..." style="max-width:240px" hx-get="/pacientes/content" hx-target="#pacientes-content" hx-swap="innerHTML" hx-trigger="input changed delay:300ms" hx-include="[name='filtroConvenio']" />
        <select name="filtroConvenio" class="form-select" style="width:auto" hx-get="/pacientes/content" hx-target="#pacientes-content" hx-swap="innerHTML" hx-trigger="change" hx-include="[name='busca']">
          <option value="todos">Todos Convênios</option>
          <option value="Camperj">Camperj</option>
          <option value="Unimed">Unimed</option>
        </select>
      </div>
    </div>
    <div id="pacientes-content" hx-get="/pacientes/content" hx-trigger="load" hx-swap="innerHTML">
      <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">Carregando...</div>
    </div>
  </div>
)

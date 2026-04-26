import { esc, when, calcularIdade } from './html.js'

interface Paciente {
  id: string
  nome: string
  convenio: string
  modalidade: string
  status: string
  data_nascimento: string | null
  motivo_desativacao: string | null
}

interface PacientesGroupedProps {
  agrupados: Record<string, Paciente[]>
  filtroStatus: string
}

function renderAvatar(nome: string): string {
  const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('')
  return `<div class="avatar" style="background:linear-gradient(135deg,rgba(59,130,246,.2),rgba(139,92,246,.2))">${esc(initials)}</div>`
}

function renderActions(p: Paciente): string {
  const svgDesativar = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>'
  const svgReativar = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'
  const svgEditar = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>'
  const svgExcluir = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'

  const toggleBtn = p.status === 'ativo'
    ? `<button class="btn-icon-warn" title="Desativar" hx-get="/pacientes/${p.id}/modal/desativar" hx-target="#modal-container" hx-swap="innerHTML">${svgDesativar}</button>`
    : `<button class="btn-icon-success" title="Reativar" hx-put="/pacientes/${p.id}/reativar" hx-target="#pacientes-content" hx-confirm="Reativar paciente ${esc(p.nome)}?">${svgReativar}</button>`

  return `<div class="flex items-center gap-1" style="flex-shrink:0;margin-left:.5rem">
    ${toggleBtn}
    <button class="btn-icon" title="Editar" hx-get="/pacientes/${p.id}/modal/editar" hx-target="#modal-container" hx-swap="innerHTML">${svgEditar}</button>
    <button class="btn-icon-danger" title="Excluir" hx-get="/pacientes/${p.id}/modal/excluir" hx-target="#modal-container" hx-swap="innerHTML">${svgExcluir}</button>
  </div>`
}

function renderPacienteRow(p: Paciente, i: number): string {
  const idade = calcularIdade(p.data_nascimento)
  const badgeClass = p.modalidade === 'ID' ? 'badge-violet' : 'badge-blue'
  const statusColor = p.status === 'ativo' ? '#34d399' : '#f87171'
  const statusText = p.status === 'ativo' ? 'Ativo' : 'Inativo'

  return `<div class="paciente-row" style="${p.status !== 'ativo' ? 'opacity:.5;' : ''}animation:slideIn .2s ease ${i * 30}ms both">
    ${renderAvatar(p.nome)}
    <div style="flex:1;min-width:0">
      <p style="font-size:.875rem;font-weight:500;color:var(--color-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.nome)}</p>
      <div class="flex items-center gap-2" style="margin-top:.25rem;flex-wrap:wrap">
        <span class="badge ${badgeClass}" style="font-size:.625rem">${esc(p.modalidade)}</span>
        ${when(idade !== null, `<span style="font-size:.6875rem;color:var(--color-text-muted)">${idade} anos</span>`)}
        <span style="font-size:.625rem;font-weight:500;color:${statusColor}">${statusText}</span>
        ${when(p.status !== 'ativo' && p.motivo_desativacao, `<span style="font-size:.625rem;color:rgba(248,113,113,.6);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(p.motivo_desativacao)}">${esc(p.motivo_desativacao)}</span>`)}
      </div>
    </div>
    ${renderActions(p)}
  </div>`
}

function renderConvenioGroup(conv: string, lista: Paciente[], gi: number): string {
  const ativos = lista.filter(p => p.status === 'ativo').length
  const inativos = lista.filter(p => p.status === 'inativo').length

  return `<div style="animation:fadeIn .3s ease ${gi * 50}ms both">
    <button class="collapsible-header" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('hidden')" style="border-radius:var(--radius-lg) var(--radius-lg) 0 0">
      <svg class="collapse-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      <span style="font-size:.875rem;font-weight:600;color:var(--color-text-primary)">${esc(conv)}</span>
      <span style="font-size:.75rem;color:var(--color-text-muted)">(${lista.length})</span>
      <span style="margin-left:auto;font-size:.75rem;color:var(--color-text-muted)">
        ${ativos} ativos${inativos > 0 ? ` · ${inativos} inativos` : ''}
      </span>
    </button>
    <div class="collapsible-content" style="border:1px solid var(--color-border);border-top:0;border-radius:0 0 var(--radius-lg) var(--radius-lg);overflow:hidden">
      ${lista.map((p, i) => renderPacienteRow(p, i)).join('')}
    </div>
  </div>`
}

export function renderPacientesGrouped({ agrupados }: PacientesGroupedProps): string {
  const sortedConvenios = Object.keys(agrupados).sort()

  if (sortedConvenios.length === 0) {
    return `<div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem;opacity:.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      <p style="font-size:.875rem;font-weight:500">Nenhum paciente encontrado</p>
      <p style="font-size:.75rem;margin-top:.25rem">Tente ajustar os filtros ou adicione um novo paciente</p>
    </div>`
  }

  return `<div class="space-y-3">${sortedConvenios.map((conv, gi) => renderConvenioGroup(conv, agrupados[conv], gi)).join('')}</div>`
}

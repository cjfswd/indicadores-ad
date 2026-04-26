import { esc, when, fmtDate } from './html.js'

interface Evento {
  id: string
  paciente_id: string
  tipo_evento: string
  data_evento: string | null
  descricao: string | null
  documentacao_url: string | null
  paciente_nome: string
  paciente_convenio: string
}

interface RegistroDetailProps {
  eventos: Evento[]
  valores: Record<string, number>
  statusReg: 'rascunho' | 'confirmado'
  ano: number
  mes: number
}

interface Campo { key: string; label: string; tipoEvento: string }
interface Grupo { codigo: string; titulo: string; campos: Campo[] }

const GRUPOS: Grupo[] = [
  { codigo: '01', titulo: 'Altas Domiciliares', campos: [
    { key: 'taxa_altas_pct', label: 'Altas', tipoEvento: 'alta' },
  ]},
  { codigo: '02', titulo: 'Intercorrências', campos: [
    { key: 'intercorrencias_total', label: 'Total', tipoEvento: 'intercorrencia' },
    { key: 'intercorr_removidas_dom', label: 'Resolvidas domicílio', tipoEvento: 'intercorr_removida_dom' },
    { key: 'intercorr_necessidade_rem', label: 'Necessidade remoção', tipoEvento: 'intercorr_necessidade_rem' },
  ]},
  { codigo: '03', titulo: 'Internação Hospitalar', campos: [
    { key: 'intern_deterioracao', label: 'Deterioração clínica', tipoEvento: 'intern_deterioracao' },
    { key: 'intern_nao_aderencia', label: 'Não aderência', tipoEvento: 'intern_nao_aderencia' },
  ]},
  { codigo: '04', titulo: 'Óbitos', campos: [
    { key: 'obitos_total', label: 'Total', tipoEvento: 'obito' },
    { key: 'obitos_menos_48h', label: '< 48h implantação', tipoEvento: 'obito_menos_48h' },
    { key: 'obitos_mais_48h', label: '≥ 48h implantação', tipoEvento: 'obito_mais_48h' },
  ]},
  { codigo: '07', titulo: 'Controle de Infecção', campos: [
    { key: 'pacientes_infectados', label: 'Pacientes infectados', tipoEvento: 'infectado' },
  ]},
  { codigo: '08', titulo: 'Eventos Adversos', campos: [
    { key: 'eventos_adversos_total', label: 'Total EA', tipoEvento: 'evento_adverso' },
    { key: 'ea_quedas', label: 'Quedas', tipoEvento: 'ea_queda' },
    { key: 'ea_broncoaspiracao', label: 'Broncoaspiração', tipoEvento: 'ea_broncoaspiracao' },
    { key: 'ea_lesao_pressao', label: 'Lesão por Pressão', tipoEvento: 'ea_lesao_pressao' },
    { key: 'ea_decanulacao', label: 'Decanulação', tipoEvento: 'ea_decanulacao' },
    { key: 'ea_saida_gtt', label: 'Saída GTT', tipoEvento: 'ea_saida_gtt' },
  ]},
  { codigo: '09', titulo: 'Ouvidorias', campos: [
    { key: 'ouv_elogios', label: 'Elogios', tipoEvento: 'ouvidoria_elogio' },
    { key: 'ouv_sugestoes', label: 'Sugestões', tipoEvento: 'ouvidoria_sugestao' },
    { key: 'ouv_reclamacoes', label: 'Reclamações', tipoEvento: 'ouvidoria_reclamacao' },
  ]},
]

const svgTrash = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'

function renderEvento(ev: Evento, ei: number, isLocked: boolean): string {
  return `<div class="evento-item" style="animation:slideIn .2s ease ${ei * 30}ms both">
    <div style="margin-top:.25rem;flex-shrink:0;width:8px;height:8px;border-radius:50%;background:var(--color-accent)"></div>
    <div style="flex:1;min-width:0">
      <div class="flex items-center gap-2" style="flex-wrap:wrap">
        <span style="font-size:.875rem;font-weight:500;color:var(--color-text-primary)">${esc(ev.paciente_nome)}</span>
        <span class="badge badge-muted" style="font-size:.625rem">${esc(ev.paciente_convenio)}</span>
      </div>
      ${when(ev.descricao, `<p style="font-size:.75rem;color:var(--color-text-secondary);margin-top:.125rem">${esc(ev.descricao)}</p>`)}
      <div class="flex items-center gap-2" style="margin-top:.25rem;flex-wrap:wrap">
        <span style="font-size:.625rem;color:var(--color-text-muted)">📅 ${fmtDate(ev.data_evento)}</span>
        ${when(ev.documentacao_url, `<a href="${esc(ev.documentacao_url)}" target="_blank" style="font-size:.625rem;color:#60a5fa;text-decoration:none">📎 Anexo</a>`)}
      </div>
    </div>
    ${when(!isLocked, `<button class="btn-icon-danger" title="Remover evento" hx-get="/registros/modal/excluir-evento/${ev.id}" hx-target="#modal-container" hx-swap="innerHTML">${svgTrash}</button>`)}
  </div>`
}

function renderCampo(campo: Campo, ci: number, val: number, evts: Evento[], isLocked: boolean, ano: number, mes: number): string {
  const borderTop = ci > 0 ? ' style="border-top:1px solid var(--overlay-border)"' : ''
  const valColor = val > 0 ? 'color:var(--color-text-primary)' : 'color:var(--color-surface-3)'

  const registerBtn = !isLocked
    ? `<button class="btn btn-sm" style="background:rgba(16,185,129,.1);color:#34d399;border:1px solid rgba(16,185,129,.2);font-size:.75rem"
              hx-get="/registros/modal/evento?tipo=${campo.tipoEvento}&label=${encodeURIComponent(campo.label)}&ano=${ano}&mes=${mes}"
              hx-target="#modal-container" hx-swap="innerHTML">+ <span class="hide-mobile">Registrar</span></button>`
    : ''

  const eventsList = evts.length > 0
    ? `<div style="padding:0 1.25rem .75rem;display:flex;flex-direction:column;gap:.375rem">${evts.map((ev, ei) => renderEvento(ev, ei, isLocked)).join('')}</div>`
    : `<div style="padding:0 1.25rem .75rem"><p style="font-size:.6875rem;color:var(--color-surface-3);font-style:italic">Nenhum evento registrado</p></div>`

  return `<div${borderTop}>
    <div class="flex items-center" style="justify-content:space-between;padding:.75rem 1.25rem">
      <div class="flex items-center gap-3">
        <span style="font-size:.875rem;font-weight:500;color:var(--color-text-primary)">${esc(campo.label)}</span>
        <span style="font-size:1.125rem;font-weight:700;${valColor};font-variant-numeric:tabular-nums">${val}</span>
      </div>
      ${registerBtn}
    </div>
    ${eventsList}
  </div>`
}

function renderGrupo(grupo: Grupo, gi: number, eventos: Evento[], valores: Record<string, number>, isLocked: boolean, ano: number, mes: number): string {
  const eventosPorTipo = (tipo: string) => eventos.filter(e => e.tipo_evento === tipo)

  return `<div class="glass-card no-hover registro-group" style="animation:fadeIn .3s ease ${gi * 40}ms both">
    <button class="collapsible-header" onclick="this.classList.toggle('collapsed');this.nextElementSibling.classList.toggle('hidden')">
      <span class="badge badge-muted" style="font-family:monospace;font-size:.7rem">${grupo.codigo}</span>
      <span style="font-size:.875rem;font-weight:600;color:var(--color-accent)">${esc(grupo.titulo)}</span>
      <svg class="collapse-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="collapsible-content" style="border-top:1px solid var(--overlay-border)">
      ${grupo.campos.map((campo, ci) => {
        const val = valores[campo.key] ?? 0
        const evts = eventosPorTipo(campo.tipoEvento)
        return renderCampo(campo, ci, val, evts, isLocked, ano, mes)
      }).join('')}
    </div>
  </div>`
}

export function renderRegistroDetail({ eventos, valores, statusReg, ano, mes }: RegistroDetailProps): string {
  const isLocked = statusReg === 'confirmado'
  return `<div class="space-y-4">${GRUPOS.map((grupo, gi) => renderGrupo(grupo, gi, eventos, valores, isLocked, ano, mes)).join('')}</div>`
}

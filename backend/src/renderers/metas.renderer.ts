import { esc } from './html.js'

interface Meta {
  id: string
  indicador_codigo: string
  ano: number
  meta_valor: number | null
  limite_alerta: number | null
  sentido: string
  mes_inicio: number | null
  mes_fim: number | null
}

interface MetasTableProps {
  metas: Meta[]
  ano: number
}

const INDICADOR_LABELS: Record<string, string> = {
  '01': 'Taxa de Altas (%)', '02': 'Intercorrências', '03': 'Taxa Internação (%)', '04': 'Óbitos',
  '05': 'Alteração PAD (%)', '06': 'Censo AD/ID', '07': 'Infectados', '08': 'Eventos Adversos', '09': 'Reclamações',
}

const MESES_CURTOS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const SENTIDO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  maior: { label: '↑ Maior', color: '#34d399', bg: 'rgba(16,185,129,.12)' },
  menor: { label: '↓ Menor', color: '#f87171', bg: 'rgba(239,68,68,.12)' },
  neutro: { label: '→ Neutro', color: '#60a5fa', bg: 'rgba(59,130,246,.12)' },
}

const INDICADOR_ICONS: Record<string, { color: string; bg: string }> = {
  '01': { color: '#34d399', bg: 'rgba(16,185,129,.15)' },
  '02': { color: '#fbbf24', bg: 'rgba(245,158,11,.15)' },
  '03': { color: '#f87171', bg: 'rgba(239,68,68,.15)' },
  '04': { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
  '05': { color: '#60a5fa', bg: 'rgba(59,130,246,.15)' },
  '06': { color: '#a78bfa', bg: 'rgba(139,92,246,.15)' },
  '07': { color: '#f97316', bg: 'rgba(249,115,22,.15)' },
  '08': { color: '#ec4899', bg: 'rgba(236,72,153,.15)' },
  '09': { color: '#22d3ee', bg: 'rgba(6,182,212,.15)' },
}

function isMonthActive(month: number, inicio: number, fim: number): boolean {
  if (inicio <= fim) return month >= inicio && month <= fim
  return month >= inicio || month <= fim
}

function renderSeasonalityBar(m: Meta, iconColor: string): string {
  const inicio = m.mes_inicio ?? 1
  const fim = m.mes_fim ?? 12

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const active = isMonthActive(month, inicio, fim)
    return `<div style="flex:1;text-align:center" title="${MESES_CURTOS[month]}${active ? ' (ativo)' : ' (fora)'}">
      <div style="height:6px;border-radius:3px;background:${active ? iconColor : 'var(--color-surface-2)'};opacity:${active ? '.8' : '.25'};transition:all .2s"></div>
      <span style="display:block;font-size:.5rem;color:${active ? 'var(--color-text-secondary)' : 'var(--color-surface-3)'};margin-top:2px;font-weight:${active ? '600' : '400'}">${MESES_CURTOS[month]}</span>
    </div>`
  })

  return `<div style="display:flex;align-items:center;gap:.125rem;margin-top:.5rem">${months.join('')}</div>`
}

function renderMetaCard(m: Meta, i: number, ano: number): string {
  const sentido = SENTIDO_CONFIG[m.sentido] ?? SENTIDO_CONFIG.neutro
  const icon = INDICADOR_ICONS[m.indicador_codigo] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' }
  const label = INDICADOR_LABELS[m.indicador_codigo] ?? m.indicador_codigo
  const svgEditar = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>'

  return `<div class="glass-card no-hover" style="padding:1rem 1.25rem;animation:fadeIn .3s ease ${i * 40}ms both">
    <div class="flex items-center" style="gap:1rem;flex-wrap:wrap;margin-bottom:.75rem">
      <div class="flex items-center gap-3" style="flex:1;min-width:200px">
        <div style="width:2.25rem;height:2.25rem;border-radius:var(--radius-md);background:${icon.bg};color:${icon.color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:.75rem;font-weight:700;font-family:monospace">${esc(m.indicador_codigo)}</span>
        </div>
        <div style="min-width:0">
          <p style="font-size:.875rem;font-weight:600;color:var(--color-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</p>
          <span style="display:inline-flex;align-items:center;gap:.2rem;padding:.125rem .5rem;border-radius:9999px;font-size:.625rem;font-weight:600;background:${sentido.bg};color:${sentido.color}">${sentido.label}</span>
        </div>
      </div>
      <div class="flex items-center gap-4" style="flex-shrink:0">
        <div style="text-align:center;min-width:56px">
          <div style="font-size:.625rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em">Meta</div>
          <div style="font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;color:${m.meta_valor != null ? 'var(--color-text-primary)' : 'var(--color-surface-3)'}">${m.meta_valor ?? '—'}</div>
        </div>
        <div style="text-align:center;min-width:56px">
          <div style="font-size:.625rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em">Alerta</div>
          <div style="font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;color:${m.limite_alerta != null ? '#fbbf24' : 'var(--color-surface-3)'}">${m.limite_alerta ?? '—'}</div>
        </div>
      </div>
      <button class="btn-icon" title="Editar" hx-get="/metas/modal/editar?indicador_codigo=${m.indicador_codigo}&ano=${ano}" hx-target="#modal-container" hx-swap="innerHTML">${svgEditar}</button>
    </div>
    ${renderSeasonalityBar(m, icon.color)}
  </div>`
}

export function renderMetasTable({ metas, ano }: MetasTableProps): string {
  if (metas.length === 0) {
    return `<div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto .75rem;opacity:.3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      <p style="font-size:.875rem">Nenhuma meta definida para ${ano}</p>
    </div>`
  }

  return `<div class="space-y-3">${metas.map((m, i) => renderMetaCard(m, i, ano)).join('')}</div>`
}

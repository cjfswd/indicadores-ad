import { createCanvas } from '@napi-rs/canvas'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316',
]

// B&W-safe pattern markers (letters shown on slice + legend)
const MARKERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartItem {
  nome: string
  valor: number
}

interface IndicadorMinimal {
  codigo: string
  nome: string
  subtipos: ChartItem[]
}

// ─── Pattern fills for B&W differentiation ────────────────────────────────────

type PatternFn = (ctx: Ctx, x: number, y: number, w: number, h: number) => void

const PATTERNS: PatternFn[] = [
  // 0: Solid (no extra pattern)
  () => {},
  // 1: Horizontal lines
  (ctx, x, y, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    for (let ly = y + 4; ly < y + h; ly += 6) {
      ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke()
    }
  },
  // 2: Diagonal lines (//)
  (ctx, x, y, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    for (let d = -h; d < w + h; d += 7) {
      ctx.beginPath(); ctx.moveTo(x + d, y + h); ctx.lineTo(x + d + h, y); ctx.stroke()
    }
  },
  // 3: Dots
  (ctx, x, y, w, h) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    for (let dx = x + 4; dx < x + w; dx += 8) {
      for (let dy = y + 4; dy < y + h; dy += 8) {
        ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, Math.PI * 2); ctx.fill()
      }
    }
  },
  // 4: Crosshatch
  (ctx, x, y, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1
    for (let d = -h; d < w + h; d += 8) {
      ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x + d + h, y + h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x + d, y + h); ctx.lineTo(x + d + h, y); ctx.stroke()
    }
  },
  // 5: Vertical lines
  (ctx, x, y, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    for (let lx = x + 4; lx < x + w; lx += 6) {
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + h); ctx.stroke()
    }
  },
]

// ─── Donut renderer ───────────────────────────────────────────────────────────

function renderDonut(title: string, items: ChartItem[]): Buffer {
  const W = 400
  const legendLineH = 18
  const legendH = items.length * legendLineH + 12
  const H = 210 + legendH
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Title
  ctx.fillStyle = '#1E293B'
  ctx.font = 'bold 13px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, W / 2, 20)

  const centerX = W / 2
  const centerY = 115
  const outerR = 70
  const innerR = 40
  const total = items.reduce((s, v) => s + v.valor, 0)

  if (total === 0) return Buffer.from(canvas.toBuffer('image/png'))

  // Draw colored arcs with patterns
  let startAngle = -Math.PI / 2
  for (let i = 0; i < items.length; i++) {
    const slice = (items[i].valor / total) * Math.PI * 2
    const endAngle = startAngle + slice

    // Color fill
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerR, startAngle, endAngle)
    ctx.arc(centerX, centerY, innerR, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    // Pattern overlay (clip to arc shape)
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerR - 1, startAngle, endAngle)
    ctx.arc(centerX, centerY, innerR + 1, endAngle, startAngle, true)
    ctx.closePath()
    ctx.clip()
    PATTERNS[i % PATTERNS.length](ctx, centerX - outerR, centerY - outerR, outerR * 2, outerR * 2)
    ctx.restore()

    // Marker letter on slice midpoint
    const midAngle = startAngle + slice / 2
    const labelR = (outerR + innerR) / 2
    const lx = centerX + labelR * Math.cos(midAngle)
    const ly = centerY + labelR * Math.sin(midAngle)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 11px Helvetica, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(MARKERS[i], lx, ly)

    startAngle = endAngle
  }

  // Center total
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(total), centerX, centerY)

  // Vertical legend with marker letters
  const legendStartY = 210
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < items.length; i++) {
    const y = legendStartY + i * legendLineH
    const x = 30
    const pct = total > 0 ? ((items[i].valor / total) * 100).toFixed(0) : '0'

    // Color swatch
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fillRect(x, y - 5, 12, 10)

    // Pattern on swatch
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y - 5, 12, 10)
    ctx.clip()
    PATTERNS[i % PATTERNS.length](ctx, x, y - 5, 12, 10)
    ctx.restore()

    // Swatch border
    ctx.strokeStyle = '#94A3B8'
    ctx.lineWidth = 0.5
    ctx.strokeRect(x, y - 5, 12, 10)

    // Marker letter + label
    ctx.fillStyle = '#1E293B'
    ctx.font = 'bold 10px Helvetica, Arial, sans-serif'
    ctx.fillText(MARKERS[i], x + 16, y)
    ctx.fillStyle = '#334155'
    ctx.font = '10px Helvetica, Arial, sans-serif'
    ctx.fillText(`- ${items[i].nome}: ${items[i].valor} (${pct}%)`, x + 26, y)
  }

  return Buffer.from(canvas.toBuffer('image/png'))
}

// ─── Bar chart renderer ───────────────────────────────────────────────────────

function renderBarChart(title: string, items: ChartItem[]): Buffer {
  const W = 400
  const legendLineH = 18
  const legendH = items.length * legendLineH + 12
  const H = 210 + legendH
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#1E293B'
  ctx.font = 'bold 13px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, W / 2, 20)

  const maxVal = Math.max(...items.map(i => i.valor), 1)
  const barAreaX = 50
  const barAreaW = W - 100
  const barAreaY = 40
  const barAreaH = 140
  const barW = Math.min(barAreaW / items.length - 8, 40)
  const gap = (barAreaW - barW * items.length) / (items.length + 1)

  // Axis
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(barAreaX, barAreaY)
  ctx.lineTo(barAreaX, barAreaY + barAreaH)
  ctx.lineTo(barAreaX + barAreaW, barAreaY + barAreaH)
  ctx.stroke()

  // Bars with patterns
  for (let i = 0; i < items.length; i++) {
    const x = barAreaX + gap + i * (barW + gap)
    const barH = (items[i].valor / maxVal) * (barAreaH - 10)
    const y = barAreaY + barAreaH - barH

    // Color fill
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fillRect(x, y, barW, barH)

    // Pattern overlay
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, barW, barH)
    ctx.clip()
    PATTERNS[i % PATTERNS.length](ctx, x, y, barW, barH)
    ctx.restore()

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(x, y, barW, barH)

    // Value + marker on top
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 10px Helvetica, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${MARKERS[i]} ${items[i].valor}`, x + barW / 2, y - 4)
  }

  // Vertical legend
  const legendStartY = 210
  const total = items.reduce((s, v) => s + v.valor, 0)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < items.length; i++) {
    const y = legendStartY + i * legendLineH
    const x = 30
    const pct = total > 0 ? ((items[i].valor / total) * 100).toFixed(0) : '0'

    // Color swatch with pattern
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fillRect(x, y - 5, 12, 10)
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y - 5, 12, 10)
    ctx.clip()
    PATTERNS[i % PATTERNS.length](ctx, x, y - 5, 12, 10)
    ctx.restore()
    ctx.strokeStyle = '#94A3B8'
    ctx.lineWidth = 0.5
    ctx.strokeRect(x, y - 5, 12, 10)

    // Marker + label
    ctx.fillStyle = '#1E293B'
    ctx.font = 'bold 10px Helvetica, Arial, sans-serif'
    ctx.fillText(MARKERS[i], x + 16, y)
    ctx.fillStyle = '#334155'
    ctx.font = '10px Helvetica, Arial, sans-serif'
    ctx.fillText(`- ${items[i].nome}: ${items[i].valor} (${pct}%)`, x + 26, y)
  }

  return Buffer.from(canvas.toBuffer('image/png'))
}

// ─── Build all chart buffers ──────────────────────────────────────────────────

interface ChartDef {
  type: 'donut' | 'bar'
  title: string
  codigo: string
}

const CHART_DEFS: ChartDef[] = [
  { type: 'donut', title: 'Obitos (< 48h vs > 48h)', codigo: '04' },
  { type: 'donut', title: 'Internacao Hospitalar', codigo: '03' },
  { type: 'donut', title: 'Intercorrencias', codigo: '02' },
  { type: 'donut', title: 'Pacientes por Modalidade', codigo: '06' },
  { type: 'donut', title: 'Pacientes Infectados', codigo: '07' },
  { type: 'bar',   title: 'Eventos Adversos por Tipo', codigo: '08' },
  { type: 'donut', title: 'Ouvidorias', codigo: '09' },
]

export function buildChartBuffers(indicadores: IndicadorMinimal[]): { title: string, buffer: Buffer }[] {
  const results: { title: string, buffer: Buffer }[] = []

  for (const def of CHART_DEFS) {
    const ind = indicadores.find(i => i.codigo === def.codigo)
    if (!ind || ind.subtipos.length === 0) continue

    const total = ind.subtipos.reduce((s, st) => s + st.valor, 0)
    if (total === 0) continue

    const buffer = def.type === 'bar'
      ? renderBarChart(def.title, ind.subtipos)
      : renderDonut(def.title, ind.subtipos)

    results.push({ title: def.title, buffer })
  }

  return results
}

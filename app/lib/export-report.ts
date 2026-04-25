import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import XLSX from 'xlsx-js-style'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubtipoData {
  nome: string
  valor: number
}

interface IndicadorData {
  codigo: string
  nome: string
  valor: number
  unidade: '%' | 'abs'
  status: string
  meta: number | null
  alerta: number | null
  variacao: number | null
  subtipos: SubtipoData[]
}

interface ReportData {
  titulo: string
  subtitulo?: string
  periodo: string
  pacientesTotal: number
  pacientesAD: number
  pacientesID: number
  eventosAdversos: number
  taxaAltas: number
  semaforos: IndicadorData[]
  registro: Record<string, unknown> | null
  chartIds: string[]
}

// ─── PDF Constants ────────────────────────────────────────────────────────────

const DARK_BLUE = { r: 30, g: 58, b: 138 } as const
const BORDER_COLOR = { r: 203, g: 213, b: 225 } as const
const ROW_ALT_BG = { r: 248, g: 250, b: 252 } as const
const ROW_H = 8
const MARGIN = 15

const STATUS_TEXT: Record<string, string> = {
  verde: 'Dentro da meta',
  amarelo: 'Atenção',
  vermelho: 'Fora da meta',
  neutro: 'Sem meta',
}

const STATUS_COLORS: Record<string, { r: number; g: number; b: number }> = {
  verde: { r: 16, g: 185, b: 129 },
  amarelo: { r: 245, g: 158, b: 11 },
  vermelho: { r: 239, g: 68, b: 68 },
  neutro: { r: 100, g: 116, b: 139 },
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildFilename(base: string, periodo: string, ext: string): string {
  return `${base}_${periodo.replace(/\s/g, '_').toLowerCase()}.${ext}`
}

// ─── PDF Helpers ──────────────────────────────────────────────────────────────

function ensureSpace(pdf: jsPDF, needed: number, y: number): number {
  if (y + needed > pdf.internal.pageSize.getHeight() - MARGIN) {
    pdf.addPage()
    return MARGIN
  }
  return y
}

function drawTopBar(pdf: jsPDF, height = 4) {
  pdf.setFillColor(DARK_BLUE.r, DARK_BLUE.g, DARK_BLUE.b)
  pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), height, 'F')
}

function drawBorderedRow(pdf: jsPDF, x: number, y: number, w: number, h: number, altBg: boolean) {
  if (altBg) {
    pdf.setFillColor(ROW_ALT_BG.r, ROW_ALT_BG.g, ROW_ALT_BG.b)
    pdf.rect(x, y, w, h, 'F')
  }
  pdf.setDrawColor(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b)
  pdf.rect(x, y, w, h, 'S')
}

/** Força tema claro para captura html2canvas */
function forceLightTheme(el: HTMLElement): () => void {
  const backups: { el: HTMLElement; attr: string; val: string }[] = []

  const resolveColor = (val: string): string | null => {
    if (!val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') return null
    if (val.includes('oklab') || val.includes('oklch') || val.includes('color-mix') || val.includes('var(')) {
      try {
        const c = document.createElement('canvas')
        c.width = c.height = 1
        const ctx = c.getContext('2d')!
        ctx.fillStyle = val
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        return a < 255 ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})` : `rgb(${r},${g},${b})`
      } catch { return null }
    }
    return null
  }

  const applyInline = (target: HTMLElement) => {
    const cs = getComputedStyle(target)
    for (const prop of ['color', 'background-color', 'border-color', 'fill', 'stroke']) {
      const resolved = resolveColor(cs.getPropertyValue(prop))
      if (resolved) {
        backups.push({ el: target, attr: prop, val: target.style.getPropertyValue(prop) })
        target.style.setProperty(prop, resolved, 'important')
      }
    }
  }

  applyInline(el)
  el.querySelectorAll<HTMLElement>('*').forEach(applyInline)

  return () => {
    for (const { el: t, attr, val } of backups) {
      if (val) t.style.setProperty(attr, val)
      else t.style.removeProperty(attr)
    }
  }
}

// ─── PDF Sections ─────────────────────────────────────────────────────────────

function renderHeader(pdf: jsPDF, data: ReportData): number {
  const pw = pdf.internal.pageSize.getWidth()
  drawTopBar(pdf)

  let y = 12
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30)
  pdf.text(data.titulo, MARGIN, y + 7)

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100)
  pdf.text(`${data.periodo}  |  Gerado em ${new Date().toLocaleString('pt-BR')}`, MARGIN, y + 14)

  y += 20
  pdf.setDrawColor(226, 232, 240)
  pdf.line(MARGIN, y, pw - MARGIN, y)
  return y + 6
}

function renderResumo(pdf: jsPDF, data: ReportData, startY: number): number {
  const pw = pdf.internal.pageSize.getWidth()
  const cw = pw - MARGIN * 2
  let y = ensureSpace(pdf, 40, startY)

  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30)
  pdf.text('Resumo Executivo', MARGIN, y + 5)
  y += 12

  const cards = [
    { label: 'Pacientes Ativos', valor: String(data.pacientesTotal), sub: `${data.pacientesAD} AD  +  ${data.pacientesID} ID`, cor: [219, 234, 254] as const },
    { label: 'Eventos Adversos', valor: String(data.eventosAdversos), sub: 'Quedas, broncoaspiração, lesão pressão, decanulação, saída GTT', cor: [254, 226, 226] as const },
    { label: 'Taxa de Altas', valor: `${data.taxaAltas}%`, sub: 'Percentual de altas domiciliares no período', cor: [220, 252, 231] as const },
  ]

  const cardW = (cw - 8) / 3
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]
    const x = MARGIN + i * (cardW + 4)

    pdf.setFillColor(c.cor[0], c.cor[1], c.cor[2])
    pdf.roundedRect(x, y, cardW, 20, 2, 2, 'F')

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(80)
    pdf.text(c.label, x + 4, y + 6)

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30)
    pdf.text(c.valor, x + 4, y + 15)

    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100)
    const lines = pdf.splitTextToSize(c.sub, cardW - 40)
    pdf.text(lines[0] ?? '', x + 30, y + 15)
  }

  return y + 26
}

function renderIndicadores(pdf: jsPDF, data: ReportData, startY: number): number {
  const pw = pdf.internal.pageSize.getWidth()
  const cw = pw - MARGIN * 2

  // Count total rows
  let totalRows = 0
  for (const s of data.semaforos) { totalRows += 1 + s.subtipos.length }
  let y = ensureSpace(pdf, 14 + ROW_H + totalRows * ROW_H, startY)

  // Section title
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30)
  pdf.text('Indicadores Assistenciais', MARGIN, y + 5)
  y += 12

  // Table columns
  const cols = [MARGIN, MARGIN + 14, MARGIN + 68, MARGIN + 96, MARGIN + 120, MARGIN + 144]
  const headers = ['Cód.', 'Indicador', 'Valor', 'Meta', 'Alerta', 'Status']

  // Table header row
  pdf.setFillColor(241, 245, 249)
  pdf.rect(MARGIN, y, cw, ROW_H, 'F')
  pdf.setDrawColor(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b)
  pdf.rect(MARGIN, y, cw, ROW_H, 'S')
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(71, 85, 105)
  headers.forEach((h, i) => pdf.text(h, cols[i] + 2, y + 5.5))
  y += ROW_H

  let rowIdx = 0

  for (const ind of data.semaforos) {
    y = ensureSpace(pdf, ROW_H * (1 + ind.subtipos.length), y)

    // ── Main indicator ──
    drawBorderedRow(pdf, MARGIN, y, cw, ROW_H, rowIdx % 2 === 0)

    pdf.setTextColor(30)
    pdf.setFontSize(7.5)
    pdf.setFont('helvetica', 'bold')
    pdf.text(ind.codigo, cols[0] + 2, y + 5.5)
    pdf.text(ind.nome.substring(0, 32), cols[1] + 2, y + 5.5)

    pdf.setFont('helvetica', 'normal')
    pdf.text(`${ind.valor}${ind.unidade === '%' ? '%' : ''}`, cols[2] + 2, y + 5.5)
    pdf.text(ind.meta != null ? `${ind.meta}${ind.unidade === '%' ? '%' : ''}` : '—', cols[3] + 2, y + 5.5)
    pdf.text(ind.alerta != null ? `${ind.alerta}${ind.unidade === '%' ? '%' : ''}` : '—', cols[4] + 2, y + 5.5)

    const sc = STATUS_COLORS[ind.status] ?? STATUS_COLORS.neutro
    pdf.setTextColor(sc.r, sc.g, sc.b)
    pdf.setFont('helvetica', 'bold')
    pdf.text(STATUS_TEXT[ind.status] ?? ind.status, cols[5] + 2, y + 5.5)
    pdf.setFont('helvetica', 'normal')

    y += ROW_H
    rowIdx++

    // ── Sub-indicators ──
    for (let j = 0; j < ind.subtipos.length; j++) {
      const sub = ind.subtipos[j]
      drawBorderedRow(pdf, MARGIN, y, cw, ROW_H, rowIdx % 2 === 0)

      pdf.setFontSize(7.5)
      pdf.setTextColor(120)
      pdf.text(`${ind.codigo}.${j + 1}`, cols[0] + 4, y + 5.5)
      pdf.setTextColor(60)
      pdf.text(sub.nome, cols[1] + 6, y + 5.5)
      pdf.text(String(sub.valor), cols[2] + 2, y + 5.5)

      y += ROW_H
      rowIdx++
    }
  }

  return y + 4
}

function addFooters(pdf: jsPDF, data: ReportData) {
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    const w = pdf.internal.pageSize.getWidth()
    const h = pdf.internal.pageSize.getHeight()
    pdf.setFontSize(7)
    pdf.setTextColor(160)
    pdf.text(`Indicadores AD — ${data.periodo}`, MARGIN, h - 6)
    pdf.text(`Página ${i} de ${totalPages}`, w - MARGIN, h - 6, { align: 'right' })
  }
}

async function captureCharts(pdf: jsPDF, chartIds: string[]) {
  for (const chartId of chartIds) {
    const el = document.getElementById(chartId)
    if (!el) { console.warn(`[PDF] #${chartId} não encontrado`); continue }

    console.log(`[PDF] Capturando #${chartId}...`)
    const restore = forceLightTheme(el)

    // Backup & force clean styles
    const origStyles = {
      bg: el.style.backgroundColor, border: el.style.border,
      boxShadow: el.style.boxShadow, backdropFilter: el.style.backdropFilter,
      outline: el.style.outline, padding: el.style.padding,
    }
    Object.assign(el.style, {
      backgroundColor: '#ffffff', border: 'none', boxShadow: 'none',
      backdropFilter: 'none', outline: 'none', padding: '16px',
    })

    const glassCards = el.querySelectorAll<HTMLElement>('.glass-card')
    const cardBackups = Array.from(glassCards).map(card => {
      const bk = { el: card, border: card.style.border, boxShadow: card.style.boxShadow, backdropFilter: card.style.backdropFilter, bg: card.style.backgroundColor }
      Object.assign(card.style, { border: 'none', boxShadow: 'none', backdropFilter: 'none', backgroundColor: '#ffffff' })
      return bk
    })

    await new Promise(r => setTimeout(r, 300))

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff', scale: 2, logging: false,
        useCORS: true, allowTaint: true, removeContainer: true,
      })

      pdf.addPage('a4', 'landscape')
      const lw = pdf.internal.pageSize.getWidth()
      const lh = pdf.internal.pageSize.getHeight()
      const lm = 12

      drawTopBar(pdf, 3)

      const imgData = canvas.toDataURL('image/png')
      const maxW = lw - lm * 2
      const maxH = lh - lm * 2 - 8
      const imgRatio = canvas.height / canvas.width
      let imgW = maxW
      let imgH = imgW * imgRatio
      if (imgH > maxH) { imgH = maxH; imgW = imgH / imgRatio }

      pdf.addImage(imgData, 'PNG', (lw - imgW) / 2, 6 + (lh - 6 - imgH) / 2, imgW, imgH)
    } finally {
      Object.assign(el.style, origStyles)
      cardBackups.forEach(({ el: card, border, boxShadow, backdropFilter, bg }) => {
        Object.assign(card.style, { border, boxShadow, backdropFilter, backgroundColor: bg })
      })
      restore()
    }
  }
}

// ─── PDF Export ────────────────────────────────────────────────────────────────

export async function exportarPDF(data: ReportData): Promise<void> {
  try {
    console.log('[PDF] Iniciando exportação...')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    let y = renderHeader(pdf, data)
    y = renderResumo(pdf, data, y)
    renderIndicadores(pdf, data, y)

    await captureCharts(pdf, data.chartIds)
    addFooters(pdf, data)

    const filename = buildFilename('relatorio', data.periodo, 'pdf')
    console.log(`[PDF] Salvando ${filename}...`)
    downloadBlob(pdf.output('blob'), filename)
  } catch (err) {
    console.error('[PDF] Erro:', err)
    alert('Erro ao gerar PDF. Verifique o console.')
  }
}

// ─── Excel Styles ─────────────────────────────────────────────────────────────

const XL_HEADER: XLSX.CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '1E3A8A' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: '1E3A8A' } } },
}

const XL_TITLE: XLSX.CellStyle = {
  font: { bold: true, sz: 16, color: { rgb: '1E293B' } },
  alignment: { horizontal: 'left' },
}

const XL_SUBTITLE: XLSX.CellStyle = {
  font: { sz: 10, color: { rgb: '64748B' } },
  alignment: { horizontal: 'left' },
}

const XL_LABEL: XLSX.CellStyle = {
  font: { sz: 10, color: { rgb: '475569' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
}

const XL_SUB_LABEL: XLSX.CellStyle = {
  font: { sz: 9, color: { rgb: '94A3B8' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
}

const XL_VALUE: XLSX.CellStyle = {
  font: { bold: true, sz: 10, color: { rgb: '1E293B' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
}

const XL_ALT_ROW: XLSX.CellStyle = {
  fill: { fgColor: { rgb: 'F8FAFC' } },
}

function xlStatusStyle(status: string): XLSX.CellStyle {
  const colors: Record<string, string> = {
    verde: '10B981', amarelo: 'F59E0B', vermelho: 'EF4444', neutro: '64748B',
  }
  return {
    font: { bold: true, sz: 10, color: { rgb: colors[status] ?? '64748B' } },
    alignment: { horizontal: 'center' },
    border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
  }
}

function mergeStyles(...styles: XLSX.CellStyle[]): XLSX.CellStyle {
  return Object.assign({}, ...styles)
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export function exportarExcel(data: ReportData): void {
  try {
    const wb = XLSX.utils.book_new()

    // ── Aba 1: Resumo ──
    const resumo: XLSX.CellObject[][] = [
      [{ v: 'Indicadores AD — Atenção Domiciliar', s: XL_TITLE, t: 's' }],
      [{ v: data.periodo, s: XL_SUBTITLE, t: 's' }],
      [{ v: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, s: XL_SUBTITLE, t: 's' }],
      [],
      [
        { v: 'Métrica', s: XL_HEADER, t: 's' },
        { v: 'Valor', s: XL_HEADER, t: 's' },
        { v: 'Detalhe', s: XL_HEADER, t: 's' },
      ],
      [
        { v: 'Pacientes Ativos', s: XL_LABEL, t: 's' },
        { v: data.pacientesTotal, s: XL_VALUE, t: 'n' },
        { v: `${data.pacientesAD} AD + ${data.pacientesID} ID`, s: XL_LABEL, t: 's' },
      ],
      [
        { v: 'Eventos Adversos', s: mergeStyles(XL_LABEL, XL_ALT_ROW), t: 's' },
        { v: data.eventosAdversos, s: mergeStyles(XL_VALUE, XL_ALT_ROW), t: 'n' },
        { v: 'Total no período', s: mergeStyles(XL_LABEL, XL_ALT_ROW), t: 's' },
      ],
      [
        { v: 'Taxa de Altas Domiciliares', s: XL_LABEL, t: 's' },
        { v: `${data.taxaAltas}%`, s: XL_VALUE, t: 's' },
        { v: 'Percentual de altas domiciliares', s: XL_LABEL, t: 's' },
      ],
    ]
    const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 45 }]
    wsResumo['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

    // ── Aba 2: Indicadores (com sub-indicadores hierárquicos) ──
    const indHeaders: XLSX.CellObject[] = ['Código', 'Indicador', 'Valor', 'Meta', 'Status']
      .map(h => ({ v: h, s: XL_HEADER, t: 's' as const }))

    const indRows: XLSX.CellObject[][] = []
    let rowIdx = 0

    for (const ind of data.semaforos) {
      const base = rowIdx % 2 === 0 ? XL_ALT_ROW : {}
      indRows.push([
        { v: ind.codigo, s: mergeStyles(XL_LABEL, base, { font: { bold: true, sz: 10, color: { rgb: '1E293B' } } }), t: 's' },
        { v: ind.nome, s: mergeStyles(XL_LABEL, base, { font: { bold: true, sz: 10, color: { rgb: '1E293B' } } }), t: 's' },
        { v: ind.valor, s: mergeStyles(XL_VALUE, base), t: 'n' },
        { v: ind.meta ?? '', s: mergeStyles(XL_VALUE, base), t: ind.meta != null ? 'n' : 's' },
        { v: STATUS_TEXT[ind.status] ?? ind.status, s: mergeStyles(xlStatusStyle(ind.status), base), t: 's' },
      ])
      rowIdx++

      for (let j = 0; j < ind.subtipos.length; j++) {
        const sub = ind.subtipos[j]
        const subBase = rowIdx % 2 === 0 ? XL_ALT_ROW : {}
        indRows.push([
          { v: `${ind.codigo}.${j + 1}`, s: mergeStyles(XL_SUB_LABEL, subBase), t: 's' },
          { v: `   ${sub.nome}`, s: mergeStyles(XL_SUB_LABEL, subBase), t: 's' },
          { v: sub.valor, s: mergeStyles(XL_VALUE, subBase), t: 'n' },
          { v: '', s: mergeStyles(XL_VALUE, subBase), t: 's' },
          { v: '', s: mergeStyles(XL_VALUE, subBase), t: 's' },
        ])
        rowIdx++
      }
    }

    const wsInd = XLSX.utils.aoa_to_sheet([indHeaders, ...indRows])
    wsInd['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 10 }, { wch: 10 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsInd, 'Indicadores')

    const filename = buildFilename('relatorio', data.periodo, 'xlsx')
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
    console.log(`[Excel] ${filename} exportado`)
  } catch (err) {
    console.error('[Excel] Erro:', err)
    alert('Erro ao gerar Excel. Verifique o console.')
  }
}

// ─── Legacy wrapper (usado por RegistroPage) ─────────────────────────────────

interface LegacyExportOptions {
  titulo: string
  subtitulo?: string
  elementIds: string[]
  nomeArquivo: string
}

export async function exportarRelatorio(opts: LegacyExportOptions): Promise<void> {
  await exportarPDF({
    titulo: opts.titulo,
    subtitulo: opts.subtitulo,
    periodo: opts.subtitulo ?? '',
    pacientesTotal: 0, pacientesAD: 0, pacientesID: 0,
    eventosAdversos: 0, taxaAltas: 0,
    semaforos: [], registro: null,
    chartIds: opts.elementIds,
  })
}

import { Router } from 'express'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildRelatorioData, type RelatorioData } from '../services/relatorio.service.js'
import { buildChartBuffers } from '../services/chart.service.js'

export const relatorioRouter = Router()

// ─── Resolve asset paths ─────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHARED_DIR = path.resolve(__dirname, '../../../shared/src')
const LOGO_PATH = path.join(SHARED_DIR, 'logo.png')
const WATERMARK_PATH = path.join(SHARED_DIR, 'marca-dagua.png')

// ─── Constants ────────────────────────────────────────────────────────────────

const DARK_BLUE = [30, 58, 138] as const
const M = 40 // page margin

const STATUS_TEXT: Record<string, string> = {
  verde: 'Dentro da meta', amarelo: 'Atenção',
  vermelho: 'Fora da meta', neutro: 'Sem meta',
}

const STATUS_PDF_COLORS: Record<string, string> = {
  verde: '#047857', amarelo: '#B45309',
  vermelho: '#B91C1C', neutro: '#475569',
}

const STATUS_XL_COLORS: Record<string, string> = {
  verde: '047857', amarelo: 'B45309',
  vermelho: 'B91C1C', neutro: '475569',
}

const SENTIDO_TEXT: Record<string, string> = {
  maior: '>= Maior melhor',
  menor: '<= Menor melhor',
  neutro: 'Informativo',
}

// ─── PDF Helpers ──────────────────────────────────────────────────────────────

function formatValue(valor: number, unidade: '%' | 'abs'): string {
  return unidade === '%' ? `${valor}%` : String(valor)
}

function formatMeta(meta: number | null, unidade: '%' | 'abs', sentido: string): string {
  if (meta == null) return '-'
  const prefix = sentido === 'maior' ? '>= ' : sentido === 'menor' ? '<= ' : ''
  return `${prefix}${meta}${unidade === '%' ? '%' : ''}`
}

/** Shorthand for text with lineBreak disabled (prevents pdfkit auto-pagination) */
function txt(doc: PDFKit.PDFDocument, text: string, x: number, y: number, w: number) {
  doc.text(text, x, y, { width: w, lineBreak: false })
}

function renderPdfHeader(doc: PDFKit.PDFDocument, data: RelatorioData): number {
  const pw = doc.page.width
  const logoW = 120
  const logoH = logoW * (344 / 1188)

  // Title (offset if logo exists)
  const titleX = fs.existsSync(LOGO_PATH) ? M + logoW + 8 : M

  doc.fontSize(18).font('Helvetica-Bold').fillColor('#1E293B')
  txt(doc, 'Indicadores AD — Atenção Domiciliar', titleX, M + 4, pw - titleX - M)

  doc.fontSize(9).font('Helvetica').fillColor('#475569')
  txt(doc, `${data.periodo}  |  Gerado em ${new Date().toLocaleString('pt-BR')}`, titleX, M + 24, pw - titleX - M)

  const lineY = M + logoH + 8
  doc.moveTo(M, lineY).lineTo(pw - M, lineY).strokeColor('#CBD5E1').stroke()
  return lineY + 8
}

function renderPdfResumo(doc: PDFKit.PDFDocument, data: RelatorioData, startY: number): number {
  const tableWidth = doc.page.width - M * 2
  const rowH = 16

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B')
  txt(doc, 'Resumo', M, startY, tableWidth)
  let y = startY + 20

  // Columns: Cód | Indicador | Valor | Meta | Sentido | Status
  const colWidths = [30, tableWidth - 30 - 50 - 65 - 70 - 80, 50, 65, 70, 80]
  const colX = [M]
  for (let i = 1; i < colWidths.length; i++) { colX[i] = colX[i - 1] + colWidths[i - 1] }

  // Header row
  doc.rect(M, y, tableWidth, rowH).fill('#E2E8F0')
  doc.rect(M, y, tableWidth, rowH).stroke('#CBD5E1')
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E293B')
  const headers = ['Cód.', 'Indicador', 'Valor', 'Meta', 'Sentido', 'Status']
  headers.forEach((h, i) => txt(doc, h, colX[i] + 4, y + 5, colWidths[i] - 8))
  y += rowH

  for (let idx = 0; idx < data.indicadores.length; idx++) {
    const ind = data.indicadores[idx]

    if (idx % 2 === 0) doc.rect(M, y, tableWidth, rowH).fill('#F8FAFC')
    doc.rect(M, y, tableWidth, rowH).stroke('#CBD5E1')

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
    txt(doc, ind.codigo, colX[0] + 4, y + 5, colWidths[0] - 8)
    txt(doc, ind.nome, colX[1] + 4, y + 5, colWidths[1] - 8)

    doc.font('Helvetica').fillColor('#1E293B')
    txt(doc, formatValue(ind.valor, ind.unidade), colX[2] + 4, y + 5, colWidths[2] - 8)
    txt(doc, formatMeta(ind.meta, ind.unidade, ind.sentido), colX[3] + 4, y + 5, colWidths[3] - 8)

    doc.fontSize(6.5).fillColor('#64748B')
    txt(doc, SENTIDO_TEXT[ind.sentido] ?? '', colX[4] + 4, y + 5, colWidths[4] - 8)

    const sc = STATUS_PDF_COLORS[ind.status] ?? STATUS_PDF_COLORS.neutro
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(sc)
    txt(doc, STATUS_TEXT[ind.status] ?? ind.status, colX[5] + 4, y + 5, colWidths[5] - 8)

    y += rowH
  }

  return y + 8
}

// Logo height for offset calculations on pages 2+
const LOGO_W = 120
const LOGO_H = LOGO_W * (344 / 1188)
const CONTENT_START = M + LOGO_H + 16 // Y position below logo on every page

function renderPdfIndicadores(doc: PDFKit.PDFDocument, data: RelatorioData) {
  doc.addPage()

  const tableWidth = doc.page.width - M * 2
  const rowH = 16

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B')
  txt(doc, 'Indicadores Assistenciais', M, CONTENT_START, tableWidth)
  let y = CONTENT_START + 20

  // Columns: Cód | Indicador | Valor | Meta | Sentido | Status
  const colWidths = [30, tableWidth - 30 - 50 - 65 - 70 - 80, 50, 65, 70, 80]
  const colX = [M]
  for (let i = 1; i < colWidths.length; i++) { colX[i] = colX[i - 1] + colWidths[i - 1] }

  // Header row
  doc.rect(M, y, tableWidth, rowH).fill('#E2E8F0')
  doc.rect(M, y, tableWidth, rowH).stroke('#CBD5E1')
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E293B')
  const headers = ['Cód.', 'Indicador', 'Valor', 'Meta', 'Sentido', 'Status']
  headers.forEach((h, i) => txt(doc, h, colX[i] + 4, y + 5, colWidths[i] - 8))
  y += rowH

  let rowIdx = 0

  for (const ind of data.indicadores) {
    if (y + rowH * (1 + ind.subtipos.length) > doc.page.height - 50) {
      doc.addPage()
      y = CONTENT_START
    }

    // Main row
    if (rowIdx % 2 === 0) doc.rect(M, y, tableWidth, rowH).fill('#F8FAFC')
    doc.rect(M, y, tableWidth, rowH).stroke('#CBD5E1')

    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A')
    txt(doc, ind.codigo, colX[0] + 4, y + 5, colWidths[0] - 8)
    txt(doc, ind.nome, colX[1] + 4, y + 5, colWidths[1] - 8)

    doc.font('Helvetica').fillColor('#1E293B')
    txt(doc, formatValue(ind.valor, ind.unidade), colX[2] + 4, y + 5, colWidths[2] - 8)
    txt(doc, formatMeta(ind.meta, ind.unidade, ind.sentido), colX[3] + 4, y + 5, colWidths[3] - 8)

    doc.fontSize(6.5).fillColor('#64748B')
    txt(doc, SENTIDO_TEXT[ind.sentido] ?? '', colX[4] + 4, y + 5, colWidths[4] - 8)

    const sc = STATUS_PDF_COLORS[ind.status] ?? STATUS_PDF_COLORS.neutro
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(sc)
    txt(doc, STATUS_TEXT[ind.status] ?? ind.status, colX[5] + 4, y + 5, colWidths[5] - 8)

    y += rowH
    rowIdx++

    // Sub-indicators
    for (let j = 0; j < ind.subtipos.length; j++) {
      const sub = ind.subtipos[j]

      if (y + rowH > doc.page.height - 50) {
        doc.addPage()
        y = CONTENT_START
      }

      if (rowIdx % 2 === 0) doc.rect(M, y, tableWidth, rowH).fill('#F8FAFC')
      doc.rect(M, y, tableWidth, rowH).stroke('#CBD5E1')

      doc.fontSize(7).font('Helvetica').fillColor('#64748B')
      txt(doc, `${ind.codigo}.${j + 1}`, colX[0] + 8, y + 5, colWidths[0] - 12)

      doc.fillColor('#334155')
      txt(doc, sub.nome, colX[1] + 10, y + 5, colWidths[1] - 14)
      txt(doc, String(sub.valor), colX[2] + 4, y + 5, colWidths[2] - 8)

      y += rowH
      rowIdx++
    }
  }
}

function addOverlays(doc: PDFKit.PDFDocument, data: RelatorioData) {
  const hasLogo = fs.existsSync(LOGO_PATH)
  const hasWatermark = fs.existsSync(WATERMARK_PATH)
  const range = doc.bufferedPageRange()
  const totalPages = range.count

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i)
    const w = doc.page.width
    const h = doc.page.height

    // Logo (every page, top-left — page 1 already has header text offset)
    if (hasLogo) {
      doc.image(LOGO_PATH, M, M, { width: LOGO_W, height: LOGO_H })
    }

    // Watermark (centered, image is already transparent)
    if (hasWatermark) {
      const wmW = 300
      const wmH = wmW * (763 / 864)
      doc.image(WATERMARK_PATH, (w - wmW) / 2, (h - wmH) / 2, { width: wmW, height: wmH })
    }

    // Footer — disable bottom margin to prevent pdfkit auto-pagination
    const savedBottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    doc.fontSize(6).font('Helvetica').fillColor('#94A3B8')
    txt(doc, `Indicadores AD — ${data.periodo}`, M, h - 22, 200)
    const pageText = `Página ${i + 1} de ${totalPages}`
    const pageTextW = doc.widthOfString(pageText)
    txt(doc, pageText, w - M - pageTextW, h - 22, pageTextW + 4)

    doc.page.margins.bottom = savedBottom
    doc.y = M
  }
}

// ─── PDF Endpoint ─────────────────────────────────────────────────────────────

relatorioRouter.get('/pdf/:ano/:mes', async (req, res) => {
  const ano = Number(req.params.ano)
  const mes = Number(req.params.mes)
  const data = await buildRelatorioData(ano, mes)

  const doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="relatorio_${data.periodo.replace(/\s/g, '_').toLowerCase()}.pdf"`)

  doc.pipe(res)

  // Page 1: Header + Resumo (9 indicadores)
  const y = renderPdfHeader(doc, data)
  renderPdfResumo(doc, data, y)

  // Page 2+: Indicadores Assistenciais (com sub-indicadores)
  renderPdfIndicadores(doc, data)

  // Page 3+: Graficos
  const charts = buildChartBuffers(data.indicadores)
  if (charts.length > 0) {
    doc.addPage()
    const pw = doc.page.width
    const chartW = (pw - M * 2 - 20) / 2  // 2 per row with 20px gap
    const chartH = chartW * 0.85           // ~aspect ratio of our 400x(200+legendH) canvas
    let cy = CONTENT_START + 20

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B')
    txt(doc, 'Graficos', M, CONTENT_START, pw - M * 2)

    for (let i = 0; i < charts.length; i++) {
      const col = i % 2  // 0 = left, 1 = right
      const cx = col === 0 ? M : M + chartW + 20

      // Page break before starting a new row
      if (col === 0 && cy + chartH > doc.page.height - 50) {
        doc.addPage()
        cy = CONTENT_START
      }

      doc.image(charts[i].buffer, cx, cy, { width: chartW, fit: [chartW, chartH] })

      // After right column, advance Y
      if (col === 1 || i === charts.length - 1) {
        cy += chartH + 16
      }
    }
  }

  // Logo + Marca d'agua + Rodape em TODAS as paginas (desenhados por ultimo)
  addOverlays(doc, data)

  doc.end()
})

// ─── Excel Constants ──────────────────────────────────────────────────────────

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
  left: { style: 'thin', color: { argb: 'CBD5E1' } },
  right: { style: 'thin', color: { argb: 'CBD5E1' } },
}

const XL_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' },
}

const XL_ALT_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' },
}

// ─── Excel Endpoint ───────────────────────────────────────────────────────────

relatorioRouter.get('/excel/:ano/:mes', async (req, res) => {
  const ano = Number(req.params.ano)
  const mes = Number(req.params.mes)
  const data = await buildRelatorioData(ano, mes)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Indicadores AD'
  wb.created = new Date()

  const ws = wb.addWorksheet('Relatório')
  ws.columns = [
    { width: 10 },  // A: Código
    { width: 36 },  // B: Indicador
    { width: 12 },  // C: Valor
    { width: 16 },  // D: Meta
    { width: 18 },  // E: Sentido
    { width: 20 },  // F: Status
  ]

  const COL_COUNT = 6
  const lastCol = String.fromCharCode(64 + COL_COUNT) // 'F'

  // ── Logo ──
  let startRow = 1
  if (fs.existsSync(LOGO_PATH)) {
    const xlLogoW = 180
    const xlLogoH = xlLogoW * (344 / 1188)
    const logoId = wb.addImage({ buffer: fs.readFileSync(LOGO_PATH) as Buffer, extension: 'png' })
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: xlLogoW, height: xlLogoH } })
    startRow = 4
  }

  // ── Title ──
  ws.mergeCells(`A${startRow}:${lastCol}${startRow}`)
  const titleCell = ws.getCell(`A${startRow}`)
  titleCell.value = 'Indicadores AD — Atenção Domiciliar'
  titleCell.font = { bold: true, size: 16, color: { argb: '0F172A' } }
  titleCell.alignment = { horizontal: 'left' }

  ws.mergeCells(`A${startRow + 1}:${lastCol}${startRow + 1}`)
  const subCell = ws.getCell(`A${startRow + 1}`)
  subCell.value = `${data.periodo}  |  Gerado em ${new Date().toLocaleString('pt-BR')}`
  subCell.font = { size: 10, color: { argb: '475569' } }

  // ── Resumo Executivo (all 9 indicators) ──
  const resumoStart = startRow + 3
  ws.mergeCells(`A${resumoStart}:${lastCol}${resumoStart}`)
  const resumoTitle = ws.getCell(`A${resumoStart}`)
  resumoTitle.value = 'Resumo'
  resumoTitle.font = { bold: true, size: 13, color: { argb: '0F172A' } }

  const resumoHeaders = ['Código', 'Indicador', 'Valor', 'Meta', 'Sentido', 'Status']
  const resumoHeaderRow = ws.getRow(resumoStart + 1)
  resumoHeaders.forEach((h, i) => {
    const cell = resumoHeaderRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 }
    cell.fill = XL_HEADER_FILL
    cell.border = THIN_BORDER
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  data.indicadores.forEach((ind, i) => {
    const r = ws.getRow(resumoStart + 2 + i)
    r.getCell(1).value = ind.codigo
    r.getCell(2).value = ind.nome
    r.getCell(3).value = formatValue(ind.valor, ind.unidade)
    r.getCell(4).value = formatMeta(ind.meta, ind.unidade, ind.sentido)
    r.getCell(5).value = SENTIDO_TEXT[ind.sentido] ?? ''
    r.getCell(6).value = STATUS_TEXT[ind.status] ?? ind.status

    for (let c = 1; c <= COL_COUNT; c++) {
      const cell = r.getCell(c)
      cell.font = c <= 2
        ? { bold: true, size: 10, color: { argb: '0F172A' } }
        : c === 6
          ? { bold: true, size: 10, color: { argb: STATUS_XL_COLORS[ind.status] ?? '475569' } }
          : c === 5
            ? { size: 9, color: { argb: '64748B' } }
            : { size: 10, color: { argb: '1E293B' } }
      cell.alignment = c <= 2 ? { horizontal: 'left' } : { horizontal: c === 6 || c === 5 ? 'center' : 'right' }
      cell.border = THIN_BORDER
      if (i % 2 === 0) cell.fill = XL_ALT_FILL
    }
  })

  // ── Indicadores Assistenciais (with sub-indicators) ──
  const indStart = resumoStart + 2 + data.indicadores.length + 2
  ws.mergeCells(`A${indStart}:${lastCol}${indStart}`)
  const indTitle = ws.getCell(`A${indStart}`)
  indTitle.value = 'Indicadores Assistenciais'
  indTitle.font = { bold: true, size: 13, color: { argb: '0F172A' } }

  const indHeaderRow = ws.getRow(indStart + 1)
  resumoHeaders.forEach((h, i) => {
    const cell = indHeaderRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 }
    cell.fill = XL_HEADER_FILL
    cell.border = THIN_BORDER
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  let xlRow = indStart + 2
  let rowIdx = 0

  for (const ind of data.indicadores) {
    const r = ws.getRow(xlRow)
    const isAlt = rowIdx % 2 === 0

    r.getCell(1).value = ind.codigo
    r.getCell(2).value = ind.nome
    r.getCell(3).value = formatValue(ind.valor, ind.unidade)
    r.getCell(4).value = formatMeta(ind.meta, ind.unidade, ind.sentido)
    r.getCell(5).value = SENTIDO_TEXT[ind.sentido] ?? ''
    r.getCell(6).value = STATUS_TEXT[ind.status] ?? ind.status

    for (let c = 1; c <= COL_COUNT; c++) {
      const cell = r.getCell(c)
      cell.font = c <= 2
        ? { bold: true, size: 10, color: { argb: '0F172A' } }
        : c === 6
          ? { bold: true, size: 10, color: { argb: STATUS_XL_COLORS[ind.status] ?? '475569' } }
          : c === 5
            ? { size: 9, color: { argb: '64748B' } }
            : { size: 10, color: { argb: '1E293B' } }
      cell.alignment = c <= 2 ? { horizontal: 'left' } : { horizontal: c === 6 || c === 5 ? 'center' : 'right' }
      cell.border = THIN_BORDER
      if (isAlt) cell.fill = XL_ALT_FILL
    }
    xlRow++
    rowIdx++

    // Sub-indicators
    for (let j = 0; j < ind.subtipos.length; j++) {
      const sub = ind.subtipos[j]
      const sr = ws.getRow(xlRow)
      const isSubAlt = rowIdx % 2 === 0

      sr.getCell(1).value = `${ind.codigo}.${j + 1}`
      sr.getCell(2).value = `   ${sub.nome}`
      sr.getCell(3).value = sub.valor
      sr.getCell(4).value = ''
      sr.getCell(5).value = ''
      sr.getCell(6).value = ''

      for (let c = 1; c <= COL_COUNT; c++) {
        const cell = sr.getCell(c)
        cell.font = { size: 9, color: { argb: '64748B' } }
        cell.alignment = c <= 2 ? { horizontal: 'left' } : { horizontal: 'right' }
        cell.border = THIN_BORDER
        if (isSubAlt) cell.fill = XL_ALT_FILL
      }
      xlRow++
      rowIdx++
    }
  }

  // Stream response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="relatorio_${data.periodo.replace(/\s/g, '_').toLowerCase()}.xlsx"`)

  await wb.xlsx.write(res)
  res.end()
})

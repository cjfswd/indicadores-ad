import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'
import { incrementarMetrica } from '../lib/campo-map.js'
import type { Insertable } from 'kysely'
import type { RegistroMensalTable } from '../config/db.schema.js'

export const registrosViewRouter = Router()

function triggerToast(res: import('express').Response, message: string) {
  res.setHeader('HX-Trigger', JSON.stringify({ showToast: { message } }))
}

// Upload config
const UPLOAD_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

const CAMPOS_VALIDOS = new Set([
  'ano', 'mes', 'taxa_altas_pct', 'intercorrencias_total', 'intercorr_removidas_dom',
  'intercorr_necessidade_rem', 'taxa_internacao_pct', 'intern_deterioracao', 'intern_nao_aderencia',
  'obitos_total', 'obitos_menos_48h', 'obitos_mais_48h', 'taxa_alteracao_pad_pct',
  'pacientes_total', 'pacientes_ad', 'pacientes_id', 'pacientes_infectados', 'infeccao_atb_48h',
  'eventos_adversos_total', 'ea_quedas', 'ea_broncoaspiracao', 'ea_lesao_pressao',
  'ea_decanulacao', 'ea_saida_gtt', 'ouvidorias_total', 'ouv_elogios', 'ouv_sugestoes', 'ouv_reclamacoes',
])

function parseBody(body: Record<string, string>) {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (CAMPOS_VALIDOS.has(k) && v !== '') {
      clean[k] = k === 'ano' || k === 'mes' ? Number(v) : (v.includes('.') ? parseFloat(v) : parseInt(v, 10))
    }
  }
  return clean
}

async function loadRegistroData(db: ReturnType<typeof getKysely>, ano: number, mes: number) {
  const registro = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()

  const pacientes = await db.selectFrom('pacientes').selectAll()
    .where('status', '=', 'ativo').orderBy('nome').execute()

  const eventos = await db.selectFrom('eventos_pacientes as e')
    .leftJoin('pacientes as p', 'p.id', 'e.paciente_id')
    .select([
      'e.id', 'e.paciente_id', 'e.ano', 'e.mes', 'e.tipo_evento',
      'e.data_evento', 'e.descricao', 'e.documentacao_url', 'e.criado_em',
      'p.nome as paciente_nome', 'p.convenio as paciente_convenio',
    ])
    .where('e.status', '=', 'ativo')
    .where('e.ano', '=', ano).where('e.mes', '=', mes)
    .orderBy('e.criado_em', 'desc').execute()

  const valores: Record<string, number> = {}
  if (registro) {
    const r = registro as Record<string, unknown>
    for (const k of CAMPOS_VALIDOS) {
      if (k !== 'ano' && k !== 'mes') valores[k] = Number(r[k] ?? 0)
    }
  }

  return {
    registroId: registro?.id ?? null,
    statusReg: (registro?.status ?? 'rascunho') as 'rascunho' | 'confirmado',
    valores,
    eventos,
    ano,
    mes,
  }
}

// GET /registros — full page (pure HTML shell, content loaded by HTMX)
registrosViewRouter.get('/', (_req, res) => {
  res.render('registros', { title: 'Registros Mensais', currentPath: '/registros' })
})

// GET /registros/content — HTMX partial (action bar + detail)
registrosViewRouter.get('/content', async (req, res) => {
  const db = getKysely()
  const hoje = new Date()
  const ano = Number(req.query.regAno || req.query.ano) || hoje.getFullYear()
  const mes = Number(req.query.regMes || req.query.mes) || (hoje.getMonth() + 1)
  const data = await loadRegistroData(db, ano, mes)
  res.render('partials/registro-detail', { ...data, layout: false })
})

// GET /registros/modal/evento — event form modal
registrosViewRouter.get('/modal/evento', async (req, res) => {
  const db = getKysely()
  const tipoEvento = req.query.tipo as string
  const label = req.query.label as string
  const ano = Number(req.query.ano)
  const mes = Number(req.query.mes)
  const pacientes = await db.selectFrom('pacientes').selectAll().where('status', '=', 'ativo').orderBy('nome').execute()
  res.render('modals/evento-form', { tipoEvento, label, ano, mes, pacientes, layout: false })
})

// GET /registros/modal/excluir-evento/:id — event delete confirm modal
registrosViewRouter.get('/modal/excluir-evento/:id', (req, res) => {
  res.render('modals/evento-excluir', { id: req.params.id, layout: false })
})

// POST /registros/eventos — create event (HTMX, returns partial)
registrosViewRouter.post('/eventos', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { paciente_id, ano: anoStr, mes: mesStr, tipo_evento, descricao, data_evento } = req.body
  const ano = Number(anoStr)
  const mes = Number(mesStr)

  if (!paciente_id || !tipo_evento || !ano || !mes) {
    res.status(400).send('<div class="form-error">Campos obrigatórios: paciente, tipo, ano, mês</div>')
    return
  }

  // Ensure registro exists
  let registro = await db.selectFrom('registros_mensais').select('id')
    .where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()
  if (!registro) {
    const id = uuid()
    await db.insertInto('registros_mensais').values({ id, ano, mes } as Insertable<RegistroMensalTable>).execute()
    registro = { id }
  }

  const id = uuid()
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  await db.insertInto('eventos_pacientes').values({
    id, paciente_id, ano, mes, tipo_evento,
    descricao: descricao || null,
    data_evento: data_evento || new Date().toISOString().slice(0, 10),
    documentacao_url: arquivoUrl,
  }).execute()

  await incrementarMetrica(db, tipo_evento, ano, mes, +1)

  const pac = await db.selectFrom('pacientes').select('nome').where('id', '=', paciente_id).executeTakeFirst()
  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'evento_paciente', entidade_id: id,
    acao: 'criar', usuario_email: getRequestEmail(req),
    campo_alterado: tipo_evento, valor_novo: pac?.nome ?? paciente_id,
  }).execute()

  const data = await loadRegistroData(db, ano, mes)
  triggerToast(res, 'Evento registrado!')
  res.render('partials/registro-detail', { ...data, layout: false })
})

// POST /registros/eventos/:id/reverter — soft delete event (HTMX)
registrosViewRouter.post('/eventos/:id/reverter', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const justificativa = String(req.body?.justificativa ?? '')

  if (!justificativa.trim()) {
    res.status(400).send('<div class="form-error">Justificativa obrigatória</div>')
    return
  }

  const evento = await db.selectFrom('eventos_pacientes').selectAll()
    .where('id', '=', id).where('status', '=', 'ativo').executeTakeFirst()
  if (!evento) { res.status(404).send('Evento não encontrado'); return }

  await db.updateTable('eventos_pacientes')
    .set({ status: 'excluido' as const })
    .where('id', '=', id).execute()

  await incrementarMetrica(db, evento.tipo_evento, evento.ano ?? 0, evento.mes ?? 0, -1)

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null
  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'evento_paciente', entidade_id: id,
    acao: 'excluir', usuario_email: getRequestEmail(req),
    campo_alterado: evento.tipo_evento, justificativa,
    documentacao_url: arquivoUrl,
  }).execute()

  const data = await loadRegistroData(db, evento.ano ?? new Date().getFullYear(), evento.mes ?? (new Date().getMonth() + 1))
  triggerToast(res, 'Evento removido')
  res.render('partials/registro-detail', { ...data, layout: false })
})

// PUT /registros/:id/confirmar — confirm record (HTMX)
registrosViewRouter.put('/:id/confirmar', async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  const antes = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) { res.status(404).send('Não encontrado'); return }

  await db.updateTable('registros_mensais')
    .set({ status: 'confirmado', atualizado_em: now() })
    .where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'registro_mensal', entidade_id: id,
    acao: 'confirmar', usuario_email: getRequestEmail(req),
    payload: JSON.stringify(antes),
  }).execute()

  const data = await loadRegistroData(db, antes.ano, antes.mes)
  triggerToast(res, 'Mês confirmado!')
  res.render('partials/registro-detail', { ...data, layout: false })
})

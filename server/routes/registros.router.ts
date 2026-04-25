import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { sql, type Insertable, type Updateable } from 'kysely'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'
import type { RegistroMensalTable } from '../config/db.schema.js'
import { NotFoundError, ConflictError } from '../errors/app-error.js'
import multer from 'multer'
import path from 'path'

export const registrosRouter = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// Campos válidos do registro (whitelist)
const CAMPOS_VALIDOS = new Set([
  'ano', 'mes', 'taxa_altas_pct', 'intercorrencias_total', 'intercorr_removidas_dom',
  'intercorr_necessidade_rem', 'taxa_internacao_pct', 'intern_deterioracao', 'intern_nao_aderencia',
  'obitos_total', 'obitos_menos_48h', 'obitos_mais_48h', 'taxa_alteracao_pad_pct',
  'pacientes_total', 'pacientes_ad', 'pacientes_id', 'pacientes_infectados', 'infeccao_atb_48h',
  'eventos_adversos_total', 'ea_quedas', 'ea_broncoaspiracao', 'ea_lesao_pressao',
  'ea_decanulacao', 'ea_saida_gtt', 'ouvidorias_total', 'ouv_elogios', 'ouv_sugestoes', 'ouv_reclamacoes',
])

function sanitizeBody(body: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (CAMPOS_VALIDOS.has(k)) clean[k] = v
  }
  return clean
}

registrosRouter.get('/', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()

  const rows = await db
    .selectFrom('registros_mensais')
    .selectAll()
    .where('ano', '=', ano)
    .orderBy('mes')
    .execute()

  res.json({ dados: rows, ano })
})

// GET /range?inicio=2026-01&fim=2026-06 — múltiplos meses para gráficos de tendência
registrosRouter.get('/range', async (req, res) => {
  const db = getKysely()
  const inicio = (req.query.inicio as string) ?? ''
  const fim = (req.query.fim as string) ?? ''

  if (!inicio || !fim) {
    res.status(400).json({ error: 'Parâmetros inicio e fim são obrigatórios (formato YYYY-MM)' })
    return
  }

  const [anoI, mesI] = inicio.split('-').map(Number)
  const [anoF, mesF] = fim.split('-').map(Number)

  const rows = await db
    .selectFrom('registros_mensais')
    .selectAll()
    .where(sql`(ano * 100 + mes)`, '>=', anoI * 100 + mesI)
    .where(sql`(ano * 100 + mes)`, '<=', anoF * 100 + mesF)
    .orderBy('ano')
    .orderBy('mes')
    .execute()

  res.json({ dados: rows, inicio, fim })
})

registrosRouter.get('/:ano/:mes', async (req, res) => {
  const db = getKysely()
  const row = await db
    .selectFrom('registros_mensais')
    .selectAll()
    .where('ano', '=', Number(req.params.ano))
    .where('mes', '=', Number(req.params.mes))
    .executeTakeFirst()

  if (!row) throw new NotFoundError('Registro mensal', `${req.params.ano}/${req.params.mes}`)
  res.json(row)
})

// POST — criar registro (aceita dados parciais para saves incrementais)
registrosRouter.post('/', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const data = sanitizeBody(req.body)

  if (!data.ano || !data.mes) {
    res.status(400).json({ error: 'ano e mes são obrigatórios' })
    return
  }

  const existing = await db
    .selectFrom('registros_mensais')
    .select('id')
    .where('ano', '=', data.ano as number)
    .where('mes', '=', data.mes as number)
    .executeTakeFirst()

  if (existing) throw new ConflictError(`Registro para ${data.ano}/${data.mes} já existe`)

  const id = uuid()
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  await db.insertInto('registros_mensais')
    .values({ id, ...data } as Insertable<RegistroMensalTable>)
    .execute()

  const created = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'registro_mensal',
    entidade_id: id,
    acao: 'criar',
    usuario_email: getRequestEmail(req),
    documentacao_url: arquivoUrl,
    payload: JSON.stringify(created),
  }).execute()

  res.status(201).json(created)
})

// PUT — atualizar registro completo
registrosRouter.put('/:id', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  const antes = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Registro', id)

  const data = sanitizeBody(req.body)
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  await db.updateTable('registros_mensais')
    .set({ ...data, atualizado_em: now() } as unknown as Updateable<RegistroMensalTable>)
    .where('id', '=', id)
    .execute()

  const depois = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'registro_mensal',
    entidade_id: id,
    acao: 'editar',
    usuario_email: getRequestEmail(req),
    documentacao_url: arquivoUrl,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  res.json(depois)
})

// PATCH — atualização parcial de campos individuais (incrementos da coordenação)
registrosRouter.patch('/:id', async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  const existing = await db.selectFrom('registros_mensais').select('id').where('id', '=', id).executeTakeFirst()
  if (!existing) throw new NotFoundError('Registro', id)

  const data = sanitizeBody(req.body)
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'Nenhum campo válido para atualizar' })
    return
  }

  await db.updateTable('registros_mensais')
    .set({ ...data, atualizado_em: now() } as unknown as Updateable<RegistroMensalTable>)
    .where('id', '=', id)
    .execute()

  const updated = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
  res.json(updated)
})

// PUT — confirmar registro (lock)
registrosRouter.put('/:id/confirmar', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  const antes = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Registro', id)

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  await db.updateTable('registros_mensais')
    .set({ status: 'confirmado', atualizado_em: now() })
    .where('id', '=', id)
    .execute()

  const depois = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'registro_mensal',
    entidade_id: id,
    acao: 'confirmar',
    usuario_email: getRequestEmail(req),
    documentacao_url: arquivoUrl,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  res.json(depois)
})

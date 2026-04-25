import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { sql } from 'kysely'
import { now } from '../lib/sql-helpers.js'
import { validate } from '../middleware/validate.middleware.js'
import { pacienteSchema, type Paciente } from '@indicadores/shared'
import { NotFoundError } from '../errors/app-error.js'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import multer from 'multer'
import path from 'path'

export const pacientesRouter = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

pacientesRouter.get('/', async (req, res) => {
  const db = getKysely()

  let query = db.selectFrom('pacientes').selectAll()

  if (req.query.convenio) query = query.where('convenio', '=', req.query.convenio as 'Camperj' | 'Unimed')
  if (req.query.ativo !== undefined) query = query.where('ativo', '=', req.query.ativo === 'true' ? 1 : 0)
  else query = query.where('ativo', '=', 1) // default: só ativos
  if (req.query.busca) query = query.where('nome', 'like', `%${req.query.busca}%`)

  const rows = await query.orderBy('convenio').orderBy('nome').execute()

  const agrupado: Record<string, unknown[]> = {}
  for (const row of rows) {
    const conv = row.convenio
    if (!agrupado[conv]) agrupado[conv] = []
    agrupado[conv].push(row)
  }

  res.json({ dados: rows, agrupado, total: rows.length })
})

pacientesRouter.get('/convenios', async (_req, res) => {
  const db = getKysely()
  const rows = await db
    .selectFrom('pacientes')
    .select('convenio')
    .distinct()
    .where('ativo', '=', 1)
    .orderBy('convenio')
    .execute()
  res.json(rows.map(r => r.convenio))
})

pacientesRouter.get('/:id', async (req, res) => {
  const db = getKysely()
  const row = await db.selectFrom('pacientes').selectAll().where('id', '=', req.params.id).executeTakeFirst()
  if (!row) throw new NotFoundError('Paciente', req.params.id)
  res.json(row)
})

// ── POST — Criar paciente ──
pacientesRouter.post('/', validate(pacienteSchema), async (req, res) => {
  const db = getKysely()
  const { nome, data_nascimento, convenio, modalidade, observacoes } = req.body as Paciente
  const id = uuid()

  await db.insertInto('pacientes').values({
    id,
    nome,
    data_nascimento: data_nascimento ?? null,
    convenio: convenio ?? 'Camperj',
    modalidade: modalidade ?? 'AD',
    observacoes: observacoes ?? null,
  }).execute()

  const created = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'paciente',
    entidade_id: id,
    acao: 'criar',
    usuario_email: getRequestEmail(req),
    valor_novo: nome,
    documentacao_url: null,
    payload: JSON.stringify(created),
  }).execute()

  res.status(201).json(created)
})

// ── PUT /:id — Editar paciente ──
pacientesRouter.put('/:id', validate(pacienteSchema), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { nome, data_nascimento, convenio, modalidade, observacoes, justificativa } = req.body as Paciente & { justificativa?: string }

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Paciente', id)


  await db.updateTable('pacientes')
    .set({
      nome, data_nascimento: data_nascimento ?? null,
      convenio, modalidade,
      observacoes: observacoes ?? null,
      atualizado_em: now(),
    })
    .where('id', '=', id)
    .execute()

  const depois = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'paciente',
    entidade_id: id,
    acao: 'editar',
    usuario_email: getRequestEmail(req),
    justificativa: justificativa || null,
    valor_anterior: antes.nome,
    valor_novo: nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  res.json(depois)
})

// ── DELETE /:id — Soft delete (desativar) ──
pacientesRouter.delete('/:id', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { justificativa, motivo, indicador } = req.body as {
    justificativa?: string; motivo?: string; indicador?: string
  }

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Paciente', id)



  await db.updateTable('pacientes')
    .set({
      ativo: 0,
      motivo_desativacao: motivo ?? null,
      indicador_desativacao: indicador ?? null,
      atualizado_em: now(),
    })
    .where('id', '=', id)
    .execute()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'paciente',
    entidade_id: id,
    acao: 'desativar',
    usuario_email: getRequestEmail(req),
    justificativa: justificativa || null,
    valor_anterior: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, motivo, indicador }),
  }).execute()

  res.json({ message: 'Paciente desativado', id })
})

// ── PUT /:id/reativar ──
pacientesRouter.put('/:id/reativar', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { justificativa } = req.body as { justificativa?: string }

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Paciente', id)
  if (antes.ativo) {
    res.status(400).json({ error: 'Paciente já está ativo' })
    return
  }



  await db.updateTable('pacientes')
    .set({
      ativo: 1,
      motivo_desativacao: null,
      indicador_desativacao: null,
      atualizado_em: now(),
    })
    .where('id', '=', id)
    .execute()

  const depois = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'paciente',
    entidade_id: id,
    acao: 'reativar',
    usuario_email: getRequestEmail(req),
    justificativa: justificativa || null,
    valor_novo: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  res.json(depois)
})

// ── PUT /:id/transferir — Transferir paciente de convênio ──
pacientesRouter.put('/:id/transferir', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { convenio, justificativa } = req.body as { convenio: 'Camperj' | 'Unimed'; justificativa?: string }

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Paciente', id)



  await db.updateTable('pacientes')
    .set({ convenio, atualizado_em: now() })
    .where('id', '=', id)
    .execute()

  const depois = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'paciente',
    entidade_id: id,
    acao: 'editar',
    usuario_email: getRequestEmail(req),
    campo_alterado: 'convenio',
    justificativa: justificativa || null,
    valor_anterior: antes.convenio,
    valor_novo: convenio,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  res.json(depois)
})
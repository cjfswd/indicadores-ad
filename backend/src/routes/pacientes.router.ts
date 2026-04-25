import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { now } from '../lib/sql-helpers.js'
import { validate } from '../middleware/validate.middleware.js'
import { pacienteSchema, type Paciente } from '@indicadores/shared'
import { NotFoundError } from '../errors/app-error.js'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'

export const pacientesRouter = Router()

// ── GET / — listar pacientes ──
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

// ── GET /convenios ──
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

// ── GET /:id ──
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

// ── Shared: desativar logic ──
async function desativarPaciente(id: string, body: { justificativa?: string; motivo?: string; indicador?: string }, req: import('express').Request) {
  const db = getKysely()

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Paciente', id)

  await db.updateTable('pacientes')
    .set({
      ativo: 0,
      motivo_desativacao: body.motivo ?? null,
      indicador_desativacao: body.indicador ?? null,
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
    justificativa: body.justificativa || null,
    valor_anterior: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, motivo: body.motivo, indicador: body.indicador }),
  }).execute()

  return { message: 'Paciente desativado', id }
}

// ── Shared: reativar logic ──
async function reativarPaciente(id: string, body: { justificativa?: string }, req: import('express').Request) {
  const db = getKysely()

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) throw new NotFoundError('Paciente', id)
  if (antes.ativo) throw new Error('Paciente já está ativo')

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
    justificativa: body.justificativa || null,
    valor_novo: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  return depois
}

// ── POST /:id/desativar — Primary desativar route (proxy-safe, body always works) ──
pacientesRouter.post('/:id/desativar', async (req, res) => {
  const result = await desativarPaciente(req.params.id, req.body ?? {}, req)
  res.json(result)
})

// ── DELETE /:id — Alias for desativar (backwards compat) ──
pacientesRouter.delete('/:id', async (req, res) => {
  const result = await desativarPaciente(req.params.id, req.body ?? {}, req)
  res.json(result)
})

// ── POST /:id/reativar — Primary reativar route (proxy-safe) ──
pacientesRouter.post('/:id/reativar', async (req, res) => {
  try {
    const result = await reativarPaciente(req.params.id, req.body ?? {}, req)
    res.json(result)
  } catch (err) {
    if (err instanceof Error && err.message === 'Paciente já está ativo') {
      res.status(400).json({ error: err.message })
      return
    }
    throw err
  }
})

// ── PUT /:id/reativar — Alias (backwards compat) ──
pacientesRouter.put('/:id/reativar', async (req, res) => {
  try {
    const result = await reativarPaciente(req.params.id, req.body ?? {}, req)
    res.json(result)
  } catch (err) {
    if (err instanceof Error && err.message === 'Paciente já está ativo') {
      res.status(400).json({ error: err.message })
      return
    }
    throw err
  }
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
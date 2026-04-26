import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'

export const metasViewRouter = Router()

// GET /metas — full page
metasViewRouter.get('/', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).orderBy('indicador_codigo').execute()
  res.render('metas', { title: 'Metas', currentPath: '/metas', ano, metas })
})

// PUT /metas — create or update (upsert by indicador_codigo + ano)
metasViewRouter.put('/', async (req, res) => {
  const db = getKysely()
  const { indicador_codigo, sentido } = req.body
  const ano = Number(req.body.ano) || new Date().getFullYear()
  const meta_valor = req.body.meta_valor !== '' ? parseFloat(req.body.meta_valor) : null
  const limite_alerta = req.body.limite_alerta !== '' ? parseFloat(req.body.limite_alerta) : null
  const mes_inicio = Number(req.body.mes_inicio) || 1
  const mes_fim = Number(req.body.mes_fim) || 12
  const email = getRequestEmail(req)

  const existing = await db.selectFrom('metas').selectAll()
    .where('indicador_codigo', '=', indicador_codigo)
    .where('ano', '=', ano).executeTakeFirst()

  if (existing) {
    const antes = { ...existing }
    await db.updateTable('metas').set({
      meta_valor, limite_alerta, sentido: sentido ?? 'menor',
      mes_inicio, mes_fim, atualizado_por: email, atualizado_em: now(),
    }).where('id', '=', existing.id).execute()

    const depois = await db.selectFrom('metas').selectAll().where('id', '=', existing.id).executeTakeFirstOrThrow()
    await db.insertInto('audit_log').values({
      id: uuid(), entidade: 'meta', entidade_id: existing.id,
      acao: 'editar', usuario_email: email,
      valor_anterior: String(antes.meta_valor ?? ''),
      valor_novo: String(meta_valor ?? ''),
      payload: JSON.stringify({ antes, depois }),
    }).execute()
  } else {
    const id = uuid()
    await db.insertInto('metas').values({
      id, indicador_codigo, ano, meta_valor, limite_alerta,
      sentido: sentido ?? 'menor', mes_inicio, mes_fim,
      atualizado_por: email,
    }).execute()

    await db.insertInto('audit_log').values({
      id: uuid(), entidade: 'meta', entidade_id: id,
      acao: 'criar', usuario_email: email,
      valor_novo: String(meta_valor ?? ''),
    }).execute()
  }

  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).orderBy('indicador_codigo').execute()
  res.render('components/metas-table', { layout: false, metas, ano })
})

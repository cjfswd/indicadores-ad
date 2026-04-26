import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'
import { INDICADORES_CONFIG } from '../services/semaforo.service.js'

export const metasViewRouter = Router()

// GET /metas — full page
metasViewRouter.get('/', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).execute()
  res.render('metas', { title: 'Metas', currentPath: '/metas', ano, metas, indicadoresConfig: INDICADORES_CONFIG })
})

// GET /metas/table — partial (HTMX)
metasViewRouter.get('/table', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).execute()
  res.render('components/metas-table', { layout: false, metas, indicadores: INDICADORES_CONFIG })
})

// PUT /metas/:id — update
metasViewRouter.put('/:id', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const meta_valor = req.body.meta_valor !== '' ? parseFloat(req.body.meta_valor) : null
  const limite_alerta = req.body.limite_alerta !== '' ? parseFloat(req.body.limite_alerta) : null

  await db.updateTable('metas')
    .set({ meta_valor, limite_alerta, atualizado_por: getRequestEmail(req), atualizado_em: now() })
    .where('id', '=', id).execute()

  const meta = await db.selectFrom('metas').selectAll().where('id', '=', id).executeTakeFirst()
  const ano = meta?.ano ?? new Date().getFullYear()
  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).execute()
  res.render('components/metas-table', { layout: false, metas, indicadores: INDICADORES_CONFIG })
})

// POST /metas — create new
metasViewRouter.post('/', async (req, res) => {
  const db = getKysely()
  const { indicador_codigo } = req.body
  const ano = new Date().getFullYear()
  const meta_valor = req.body.meta_valor !== '' ? parseFloat(req.body.meta_valor) : null
  const limite_alerta = req.body.limite_alerta !== '' ? parseFloat(req.body.limite_alerta) : null
  const config = INDICADORES_CONFIG[indicador_codigo]

  const id = uuid()
  await db.insertInto('metas').values({
    id, indicador_codigo, ano,
    meta_valor, limite_alerta,
    sentido: config?.sentido ?? 'neutro',
    atualizado_por: getRequestEmail(req),
  }).execute()

  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).execute()
  res.render('components/metas-table', { layout: false, metas, indicadores: INDICADORES_CONFIG })
})

import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'

export const metasViewRouter = Router()

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

// GET /metas — full page (pure HTML shell, content loaded by HTMX)
metasViewRouter.get('/', (_req, res) => {
  res.render('metas', { title: 'Metas', currentPath: '/metas' })
})

// GET /metas/content — HTMX partial (metas table)
metasViewRouter.get('/content', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.metasAno || req.query.ano) || new Date().getFullYear()
  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).orderBy('indicador_codigo').execute()
  res.render('components/metas-table', { layout: false, metas, ano })
})

// GET /metas/modal/editar — meta form modal (pre-populated or empty)
metasViewRouter.get('/modal/editar', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.metasAno || req.query.ano) || new Date().getFullYear()
  const codigo = req.query.indicador_codigo as string | undefined
  let meta = null
  if (codigo) {
    meta = await db.selectFrom('metas').selectAll()
      .where('indicador_codigo', '=', codigo).where('ano', '=', ano).executeTakeFirst()
  }
  res.render('modals/meta-form', { layout: false, meta, ano })
})

// PUT /metas — create or update (upsert by indicador_codigo + ano)
metasViewRouter.put('/', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { indicador_codigo, sentido } = req.body
  const ano = Number(req.body.ano) || new Date().getFullYear()
  const meta_valor = req.body.meta_valor !== '' ? parseFloat(req.body.meta_valor) : null
  const limite_alerta = req.body.limite_alerta !== '' ? parseFloat(req.body.limite_alerta) : null
  const mes_inicio = Number(req.body.mes_inicio) || 1
  const mes_fim = Number(req.body.mes_fim) || 12
  const email = getRequestEmail(req)
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

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
      documentacao_url: arquivoUrl,
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
      documentacao_url: arquivoUrl,
    }).execute()
  }

  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).orderBy('indicador_codigo').execute()
  triggerToast(res, 'Meta salva!')
  res.render('components/metas-table', { layout: false, metas, ano })
})

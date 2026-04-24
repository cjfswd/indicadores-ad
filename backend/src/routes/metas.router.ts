import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { sql } from 'kysely'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'
import multer from 'multer'
import path from 'path'

export const metasRouter = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads'),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

metasRouter.get('/', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const mesInicio = req.query.mes_inicio ? Number(req.query.mes_inicio) : undefined
  const mesFim = req.query.mes_fim ? Number(req.query.mes_fim) : undefined

  let query = db
    .selectFrom('metas')
    .selectAll()
    .where('ano', '=', ano)

  if (mesInicio !== undefined) query = query.where('mes_inicio', '=', mesInicio)
  if (mesFim !== undefined) query = query.where('mes_fim', '=', mesFim)

  const rows = await query.orderBy('indicador_codigo').execute()

  if (rows.length === 0) {
    res.json({
      dados: getDefaultMetas(ano, mesInicio ?? 1, mesFim ?? 12),
      ano, mes_inicio: mesInicio ?? 1, mes_fim: mesFim ?? 12, isDefault: true,
    })
    return
  }
  res.json({ dados: rows, ano, mes_inicio: mesInicio ?? 1, mes_fim: mesFim ?? 12, isDefault: false })
})

metasRouter.put('/', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  // Support both JSON array body and FormData with stringified 'metas' field
  const rawBody = Array.isArray(req.body) ? req.body : (
    typeof req.body?.metas === 'string' ? JSON.parse(req.body.metas) : req.body
  )
  const metas = rawBody as Array<{
    indicador_codigo: string; ano: number; mes_inicio?: number; mes_fim?: number
    meta_valor: number | null; limite_alerta: number | null; sentido: string
  }>

  for (const m of metas) {
    const mesI = m.mes_inicio ?? 1
    const mesF = m.mes_fim ?? 12

    // Buscar valor anterior para auditoria
    const anterior = await db
      .selectFrom('metas')
      .select(['meta_valor', 'limite_alerta'])
      .where('indicador_codigo', '=', m.indicador_codigo)
      .where('ano', '=', m.ano)
      .where('mes_inicio', '=', mesI)
      .where('mes_fim', '=', mesF)
      .executeTakeFirst()

    const valorAnterior = anterior ? JSON.stringify({ meta: anterior.meta_valor, alerta: anterior.limite_alerta }) : null
    const valorNovo = JSON.stringify({ meta: m.meta_valor, alerta: m.limite_alerta })

    // Tentar update primeiro
    const result = await db
      .updateTable('metas')
      .set({
        meta_valor: m.meta_valor,
        limite_alerta: m.limite_alerta,
        sentido: (m.sentido ?? 'menor') as 'maior' | 'menor' | 'neutro',
        atualizado_em: now(),
      })
      .where('indicador_codigo', '=', m.indicador_codigo)
      .where('ano', '=', m.ano)
      .where('mes_inicio', '=', mesI)
      .where('mes_fim', '=', mesF)
      .executeTakeFirst()

    const changed = Number(result.numUpdatedRows ?? 0n)

    if (changed === 0) {
      await db.insertInto('metas').values({
        id: uuid(),
        indicador_codigo: m.indicador_codigo,
        ano: m.ano,
        mes_inicio: mesI,
        mes_fim: mesF,
        meta_valor: m.meta_valor,
        limite_alerta: m.limite_alerta,
        sentido: (m.sentido ?? 'menor') as 'maior' | 'menor' | 'neutro',
      }).execute()
    }

    // Audit log — só se houve mudança real
    if (valorAnterior !== valorNovo) {
      const metaRow = await db
        .selectFrom('metas')
        .selectAll()
        .where('indicador_codigo', '=', m.indicador_codigo)
        .where('ano', '=', m.ano)
        .where('mes_inicio', '=', mesI)
        .where('mes_fim', '=', mesF)
        .executeTakeFirst()

      await db.insertInto('audit_log').values({
        id: uuid(),
        entidade: 'meta',
        entidade_id: m.indicador_codigo,
        acao: changed > 0 ? 'editar' : 'criar',
        usuario_email: getRequestEmail(req),
        campo_alterado: `indicador_${m.indicador_codigo}`,
        valor_anterior: valorAnterior,
        valor_novo: valorNovo,
        documentacao_url: arquivoUrl,
        payload: JSON.stringify({ antes: anterior ?? null, depois: metaRow }),
      }).execute()
    }
  }

  const ano = metas[0]?.ano ?? new Date().getFullYear()
  const mesI = metas[0]?.mes_inicio ?? 1
  const mesF = metas[0]?.mes_fim ?? 12

  const result = await db
    .selectFrom('metas')
    .selectAll()
    .where('ano', '=', ano)
    .where('mes_inicio', '=', mesI)
    .where('mes_fim', '=', mesF)
    .orderBy('indicador_codigo')
    .execute()

  res.json({ dados: result, ano, mes_inicio: mesI, mes_fim: mesF })
})

function getDefaultMetas(ano: number, mesInicio: number, mesFim: number) {
  return [
    { indicador_codigo: '01', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 20, limite_alerta: 15, sentido: 'maior' },
    { indicador_codigo: '02', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 3, limite_alerta: 6, sentido: 'menor' },
    { indicador_codigo: '03', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 5, limite_alerta: 10, sentido: 'menor' },
    { indicador_codigo: '04', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 1, limite_alerta: 3, sentido: 'menor' },
    { indicador_codigo: '05', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: null, limite_alerta: null, sentido: 'neutro' },
    { indicador_codigo: '06', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: null, limite_alerta: null, sentido: 'neutro' },
    { indicador_codigo: '07', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 2, limite_alerta: 5, sentido: 'menor' },
    { indicador_codigo: '08', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 0, limite_alerta: 2, sentido: 'menor' },
    { indicador_codigo: '09', ano, mes_inicio: mesInicio, mes_fim: mesFim, meta_valor: 0, limite_alerta: 2, sentido: 'menor' },
  ]
}

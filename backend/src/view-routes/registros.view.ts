import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'
import type { Insertable } from 'kysely'
import type { RegistroMensalTable } from '../config/db.schema.js'

export const registrosViewRouter = Router()

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

// GET /registros — full page
registrosViewRouter.get('/', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const registros = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).orderBy('mes').execute()
  res.render('registros', { title: 'Registros Mensais', currentPath: '/registros', ano, registros })
})

// GET /registros/table — partial (HTMX)
registrosViewRouter.get('/table', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const registros = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).orderBy('mes').execute()
  res.render('components/registros-table', { layout: false, registros })
})

// POST /registros — create (HTMX form, returns partial)
registrosViewRouter.post('/', async (req, res) => {
  const db = getKysely()
  const data = parseBody(req.body)

  if (!data.ano || !data.mes) {
    res.status(400).send('<div class="form-error">Ano e mês são obrigatórios</div>')
    return
  }

  const existing = await db.selectFrom('registros_mensais').select('id')
    .where('ano', '=', data.ano as number).where('mes', '=', data.mes as number).executeTakeFirst()

  if (existing) {
    res.status(409).send('<div class="form-error">Registro já existe para este período</div>')
    return
  }

  const id = uuid()
  await db.insertInto('registros_mensais')
    .values({ id, ...data } as Insertable<RegistroMensalTable>).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'registro_mensal', entidade_id: id,
    acao: 'criar', usuario_email: getRequestEmail(req),
    payload: JSON.stringify(data),
  }).execute()

  const ano = data.ano as number
  const registros = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).orderBy('mes').execute()
  res.render('components/registros-table', { layout: false, registros })
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
  }).execute()

  const registros = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', antes.ano).orderBy('mes').execute()
  res.render('components/registros-table', { layout: false, registros })
})

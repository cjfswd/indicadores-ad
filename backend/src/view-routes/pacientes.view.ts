import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'

export const pacientesViewRouter = Router()

// GET /pacientes — full page
pacientesViewRouter.get('/', async (_req, res) => {
  const db = getKysely()
  const pacientes = await db.selectFrom('pacientes').selectAll()
    .where('status', '=', 'ativo').orderBy('nome').execute()
  res.render('pacientes', { title: 'Pacientes', currentPath: '/pacientes', pacientes })
})

// GET /pacientes/table — partial (HTMX)
pacientesViewRouter.get('/table', async (req, res) => {
  const db = getKysely()
  const status = (req.query.status as string) || 'ativo'

  let query = db.selectFrom('pacientes').selectAll().orderBy('nome')
  if (status !== 'todos') {
    query = query.where('status', '=', status as 'ativo' | 'inativo')
  } else {
    query = query.where('status', '!=', 'excluido')
  }

  const pacientes = await query.execute()
  res.render('components/pacientes-table', { layout: false, pacientes })
})

// POST /pacientes — create (HTMX)
pacientesViewRouter.post('/', async (req, res) => {
  const db = getKysely()
  const { nome, data_nascimento, convenio, modalidade, observacoes } = req.body

  if (!nome || nome.length < 3) {
    res.status(400).send('<div class="form-error">Nome deve ter pelo menos 3 caracteres</div>')
    return
  }

  const id = uuid()
  await db.insertInto('pacientes').values({
    id, nome, data_nascimento: data_nascimento || null,
    convenio, modalidade, observacoes: observacoes || null,
  }).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'criar', usuario_email: getRequestEmail(req),
    valor_novo: nome,
  }).execute()

  const pacientes = await db.selectFrom('pacientes').selectAll()
    .where('status', '=', 'ativo').orderBy('nome').execute()
  res.render('components/pacientes-table', { layout: false, pacientes })
})

// PUT /pacientes/:id/desativar
pacientesViewRouter.put('/:id/desativar', async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  await db.updateTable('pacientes')
    .set({ status: 'inativo', atualizado_em: now() })
    .where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'desativar', usuario_email: getRequestEmail(req),
  }).execute()

  const pacientes = await db.selectFrom('pacientes').selectAll()
    .where('status', '=', 'ativo').orderBy('nome').execute()
  res.render('components/pacientes-table', { layout: false, pacientes })
})

// PUT /pacientes/:id/reativar
pacientesViewRouter.put('/:id/reativar', async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  await db.updateTable('pacientes')
    .set({ status: 'ativo', atualizado_em: now() })
    .where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'reativar', usuario_email: getRequestEmail(req),
  }).execute()

  const pacientes = await db.selectFrom('pacientes').selectAll()
    .where('status', '=', 'inativo').orderBy('nome').execute()
  res.render('components/pacientes-table', { layout: false, pacientes })
})

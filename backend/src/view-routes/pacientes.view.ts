import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'

export const pacientesViewRouter = Router()

const INDICADORES_DESATIVACAO = [
  { codigo: '01', nome: 'Alta Domiciliar' },
  { codigo: '03', nome: 'Internação Hospitalar' },
  { codigo: '04', nome: 'Óbito' },
]

function calcularIdade(dataNasc: string | null) {
  if (!dataNasc) return null
  const hoje = new Date(); const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

async function loadPacienteData(db: ReturnType<typeof getKysely>, filtroStatus: string, busca?: string, filtroConvenio?: string) {
  let query = db.selectFrom('pacientes').selectAll()

  if (filtroStatus === 'todos') query = query.where('status', '!=', 'excluido')
  else if (filtroStatus === 'inativo') query = query.where('status', '=', 'inativo')
  else query = query.where('status', '=', 'ativo')

  if (filtroConvenio && filtroConvenio !== 'todos') {
    query = query.where('convenio', '=', filtroConvenio as 'Camperj' | 'Unimed')
  }
  if (busca) query = query.where('nome', 'like', `%${busca}%`)

  const pacientes = await query.orderBy('convenio').orderBy('nome').execute()

  const agrupados: Record<string, typeof pacientes> = {}
  for (const p of pacientes) {
    if (!agrupados[p.convenio]) agrupados[p.convenio] = []
    agrupados[p.convenio].push(p)
  }

  const convenios = [...new Set(pacientes.map(p => p.convenio))].sort()
  return { pacientes, agrupados, convenios, filtroStatus, busca, calcularIdade, INDICADORES_DESATIVACAO }
}

// GET /pacientes — full page
pacientesViewRouter.get('/', async (req, res) => {
  const db = getKysely()
  const filtroStatus = (req.query.filtroStatus as string) ?? 'ativo'
  const data = await loadPacienteData(db, filtroStatus)
  res.render('pacientes', { title: 'Pacientes', currentPath: '/pacientes', ...data })
})

// GET /pacientes/content — HTMX partial (grouped list)
pacientesViewRouter.get('/content', async (req, res) => {
  const db = getKysely()
  const filtroStatus = (req.query.filtroStatus as string) ?? 'ativo'
  const busca = req.query.busca as string | undefined
  const filtroConvenio = req.query.filtroConvenio as string | undefined
  const data = await loadPacienteData(db, filtroStatus, busca, filtroConvenio)
  res.render('components/pacientes-grouped', { layout: false, ...data })
})

// POST /pacientes — create
pacientesViewRouter.post('/', async (req, res) => {
  const db = getKysely()
  const { nome, convenio, modalidade, data_nascimento, observacoes } = req.body
  const id = uuid()

  await db.insertInto('pacientes').values({
    id, nome, convenio: convenio ?? 'Camperj', modalidade: modalidade ?? 'AD',
    data_nascimento: data_nascimento || null, observacoes: observacoes || null,
  }).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'criar', usuario_email: getRequestEmail(req), valor_novo: nome,
  }).execute()

  const data = await loadPacienteData(db, 'ativo')
  res.render('components/pacientes-grouped', { layout: false, ...data })
})

// PUT /pacientes/:id — edit
pacientesViewRouter.put('/:id', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { nome, convenio, modalidade, data_nascimento, observacoes } = req.body

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) { res.status(404).send('Não encontrado'); return }

  await db.updateTable('pacientes').set({
    nome, convenio, modalidade, data_nascimento: data_nascimento || null,
    observacoes: observacoes || null, atualizado_em: now(),
  }).where('id', '=', id).execute()

  const depois = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'editar', usuario_email: getRequestEmail(req),
    valor_anterior: antes.nome, valor_novo: nome,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  const data = await loadPacienteData(db, 'ativo')
  res.render('components/pacientes-grouped', { layout: false, ...data })
})

// PUT /pacientes/:id/desativar
pacientesViewRouter.put('/:id/desativar', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { justificativa, indicador } = req.body

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) { res.status(404).send('Não encontrado'); return }

  await db.updateTable('pacientes').set({
    status: 'inativo' as const,
    motivo_desativacao: justificativa ?? null,
    indicador_desativacao: indicador || null,
    atualizado_em: now(),
  }).where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'desativar', usuario_email: getRequestEmail(req),
    justificativa: justificativa || null, valor_anterior: antes.nome,
    payload: JSON.stringify({ antes, motivo: justificativa, indicador }),
  }).execute()

  const data = await loadPacienteData(db, 'ativo')
  res.render('components/pacientes-grouped', { layout: false, ...data })
})

// PUT /pacientes/:id/reativar
pacientesViewRouter.put('/:id/reativar', async (req, res) => {
  const db = getKysely()
  const { id } = req.params

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) { res.status(404).send('Não encontrado'); return }

  await db.updateTable('pacientes').set({
    status: 'ativo' as const, motivo_desativacao: null,
    indicador_desativacao: null, atualizado_em: now(),
  }).where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'reativar', usuario_email: getRequestEmail(req), valor_novo: antes.nome,
  }).execute()

  const data = await loadPacienteData(db, 'ativo')
  res.render('components/pacientes-grouped', { layout: false, ...data })
})

// DELETE /pacientes/:id
pacientesViewRouter.delete('/:id', async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { justificativa } = req.body

  if (!justificativa?.trim()) { res.status(400).send('Justificativa obrigatória'); return }

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) { res.status(404).send('Não encontrado'); return }

  await db.updateTable('pacientes').set({ status: 'excluido' as const, atualizado_em: now() }).where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'excluir', usuario_email: getRequestEmail(req),
    justificativa, valor_anterior: antes.nome,
    payload: JSON.stringify({ antes }),
  }).execute()

  const data = await loadPacienteData(db, 'ativo')
  res.render('components/pacientes-grouped', { layout: false, ...data })
})

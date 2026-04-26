import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'

export const pacientesViewRouter = Router()

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

  return { agrupados }
}

function sendGrouped(res: import('express').Response, agrupados: Record<string, Array<{ id: string; nome: string; convenio: string; modalidade: string; status: string; data_nascimento: string | null; motivo_desativacao: string | null }>>) {
  res.render('partials/pacientes-list', { agrupados, layout: false })
}

// GET /pacientes — full page (pure HTML shell, content loaded by HTMX)
pacientesViewRouter.get('/', (_req, res) => {
  res.render('pacientes', { title: 'Pacientes', currentPath: '/pacientes' })
})

// GET /pacientes/content — HTMX partial (grouped list)
pacientesViewRouter.get('/content', async (req, res) => {
  const db = getKysely()
  const filtroStatus = (req.query.filtroStatus as string) ?? 'ativo'
  const busca = req.query.busca as string | undefined
  const filtroConvenio = req.query.filtroConvenio as string | undefined
  const { agrupados } = await loadPacienteData(db, filtroStatus, busca, filtroConvenio)
  sendGrouped(res, agrupados)
})

// GET /pacientes/modal/novo — empty form modal
pacientesViewRouter.get('/modal/novo', (_req, res) => {
  res.render('modals/paciente-form', { paciente: null, layout: false })
})

// GET /pacientes/:id/modal/editar — pre-populated form modal
pacientesViewRouter.get('/:id/modal/editar', async (req, res) => {
  const db = getKysely()
  const paciente = await db.selectFrom('pacientes').selectAll().where('id', '=', req.params.id).executeTakeFirst()
  if (!paciente) { res.status(404).send('Não encontrado'); return }
  res.render('modals/paciente-form', { paciente, layout: false })
})

// GET /pacientes/:id/modal/desativar
pacientesViewRouter.get('/:id/modal/desativar', async (req, res) => {
  const db = getKysely()
  const paciente = await db.selectFrom('pacientes').select(['id', 'nome']).where('id', '=', req.params.id).executeTakeFirst()
  if (!paciente) { res.status(404).send('Não encontrado'); return }
  res.render('modals/paciente-desativar', { id: paciente.id, nome: paciente.nome, layout: false })
})

// GET /pacientes/:id/modal/excluir
pacientesViewRouter.get('/:id/modal/excluir', (_req, res) => {
  res.render('modals/paciente-excluir', { id: _req.params.id, layout: false })
})

// POST /pacientes — create
pacientesViewRouter.post('/', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { nome, convenio, modalidade, data_nascimento, observacoes } = req.body
  const id = uuid()
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  await db.insertInto('pacientes').values({
    id, nome, convenio: convenio ?? 'Camperj', modalidade: modalidade ?? 'AD',
    data_nascimento: data_nascimento || null, observacoes: observacoes || null,
  }).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'criar', usuario_email: getRequestEmail(req), valor_novo: nome,
    documentacao_url: arquivoUrl,
  }).execute()

  const { agrupados } = await loadPacienteData(db, 'ativo')
  triggerToast(res, 'Paciente cadastrado!')
  sendGrouped(res, agrupados)
})

// PUT /pacientes/:id — edit
pacientesViewRouter.put('/:id', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { nome, convenio, modalidade, data_nascimento, observacoes } = req.body
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

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
    documentacao_url: arquivoUrl,
  }).execute()

  const { agrupados } = await loadPacienteData(db, 'ativo')
  triggerToast(res, 'Paciente atualizado!')
  sendGrouped(res, agrupados)
})

// PUT /pacientes/:id/desativar
pacientesViewRouter.put('/:id/desativar', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { justificativa, indicador } = req.body
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

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
    documentacao_url: arquivoUrl,
  }).execute()

  const { agrupados } = await loadPacienteData(db, 'ativo')
  triggerToast(res, 'Paciente desativado')
  sendGrouped(res, agrupados)
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

  const { agrupados } = await loadPacienteData(db, 'ativo')
  triggerToast(res, 'Paciente reativado!')
  sendGrouped(res, agrupados)
})

// POST /pacientes/:id/excluir
pacientesViewRouter.post('/:id/excluir', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const { justificativa } = req.body
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  if (!justificativa?.trim()) { res.status(400).send('Justificativa obrigatória'); return }

  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) { res.status(404).send('Não encontrado'); return }

  await db.updateTable('pacientes').set({ status: 'excluido' as const, atualizado_em: now() }).where('id', '=', id).execute()

  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'paciente', entidade_id: id,
    acao: 'excluir', usuario_email: getRequestEmail(req),
    justificativa, valor_anterior: antes.nome,
    payload: JSON.stringify({ antes }),
    documentacao_url: arquivoUrl,
  }).execute()

  const { agrupados } = await loadPacienteData(db, 'ativo')
  triggerToast(res, 'Paciente excluído')
  sendGrouped(res, agrupados)
})

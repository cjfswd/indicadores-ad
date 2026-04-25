import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { NotFoundError } from '../errors/app-error.js'
import { incrementarMetrica } from '../lib/campo-map.js'

export const eventosRouter = Router()

// ── Upload config ──
const UPLOAD_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB

// GET /eventos?ano=&mes=&tipo_evento=&paciente_id=
eventosRouter.get('/', async (req, res) => {
  const db = getKysely()

  let query = db
    .selectFrom('eventos_pacientes as e')
    .leftJoin('pacientes as p', 'p.id', 'e.paciente_id')
    .select([
      'e.id', 'e.paciente_id', 'e.registro_id', 'e.ano', 'e.mes',
      'e.tipo_evento', 'e.subtipo', 'e.data_evento', 'e.observacao_texto',
      'e.documentacao_url', 'e.descricao', 'e.registrado_por', 'e.ativo', 'e.criado_em',
      'p.nome as paciente_nome', 'p.convenio as paciente_convenio', 'p.modalidade as paciente_modalidade',
    ])
    .where('e.ativo', '=', true) // só eventos ativos

  if (req.query.ano) query = query.where('e.ano', '=', Number(req.query.ano))
  if (req.query.mes) query = query.where('e.mes', '=', Number(req.query.mes))
  if (req.query.tipo_evento) query = query.where('e.tipo_evento', '=', req.query.tipo_evento as string)
  if (req.query.paciente_id) query = query.where('e.paciente_id', '=', req.query.paciente_id as string)

  const rows = await query.orderBy('e.criado_em', 'desc').execute()
  res.json({ dados: rows, total: rows.length })
})

// POST /eventos — com upload de arquivo opcional
eventosRouter.post('/', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { paciente_id, ano, mes, tipo_evento, subtipo, descricao, data_evento } = req.body

  if (!paciente_id || !tipo_evento || !ano || !mes) {
    res.status(400).json({ error: 'paciente_id, tipo_evento, ano e mes são obrigatórios' })
    return
  }

  const paciente = await db.selectFrom('pacientes').select('id').where('id', '=', paciente_id).where('ativo', '=', true).executeTakeFirst()
  if (!paciente) throw new NotFoundError('Paciente', paciente_id)

  const id = uuid()
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  await db.insertInto('eventos_pacientes').values({
    id,
    paciente_id,
    ano: Number(ano),
    mes: Number(mes),
    tipo_evento,
    subtipo: subtipo ?? null,
    descricao: descricao ?? null,
    data_evento: data_evento ?? new Date().toISOString().slice(0, 10),
    documentacao_url: arquivoUrl,
  }).execute()

  await incrementarMetrica(db, tipo_evento, Number(ano), Number(mes), +1)

  // Audit log com snapshot completo
  const created = await db
    .selectFrom('eventos_pacientes as e')
    .leftJoin('pacientes as p', 'p.id', 'e.paciente_id')
    .select([
      'e.id', 'e.paciente_id', 'e.registro_id', 'e.ano', 'e.mes',
      'e.tipo_evento', 'e.subtipo', 'e.data_evento', 'e.observacao_texto',
      'e.documentacao_url', 'e.descricao', 'e.registrado_por', 'e.ativo', 'e.criado_em',
      'p.nome as paciente_nome', 'p.convenio as paciente_convenio', 'p.modalidade as paciente_modalidade',
    ])
    .where('e.id', '=', id)
    .executeTakeFirst()

  const pac = await db.selectFrom('pacientes').select('nome').where('id', '=', paciente_id).executeTakeFirst()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'evento_paciente',
    entidade_id: id,
    acao: 'criar',
    usuario_email: getRequestEmail(req),
    campo_alterado: tipo_evento,
    valor_novo: pac?.nome ?? paciente_id,
    payload: JSON.stringify(created),
  }).execute()

  res.status(201).json(created)
})

// ── Soft delete de evento: desativa em vez de deletar ──
async function softDeleteEvento(id: string, justificativa: string, arquivoUrl: string | null, req: import('express').Request) {
  const db = getKysely()

  // Snapshot completo do evento + paciente ANTES de desativar
  const eventoFull = await db
    .selectFrom('eventos_pacientes as e')
    .leftJoin('pacientes as p', 'p.id', 'e.paciente_id')
    .select([
      'e.id', 'e.paciente_id', 'e.ano', 'e.mes', 'e.tipo_evento',
      'e.documentacao_url', 'e.ativo',
      'p.nome as paciente_nome', 'p.convenio as paciente_convenio',
    ])
    .where('e.id', '=', id)
    .where('e.ativo', '=', true)
    .executeTakeFirst()

  if (!eventoFull) throw new NotFoundError('Evento', id)

  const tipoEvento = eventoFull.tipo_evento
  const ano = eventoFull.ano as number
  const mes = eventoFull.mes as number

  await incrementarMetrica(db, tipoEvento, ano, mes, -1)

  // Soft delete
  await db.updateTable('eventos_pacientes')
    .set({ ativo: false })
    .where('id', '=', id)
    .execute()

  const depois = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', id).executeTakeFirstOrThrow()

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'evento_paciente',
    entidade_id: id,
    acao: 'excluir',
    usuario_email: getRequestEmail(req),
    campo_alterado: tipoEvento,
    valor_novo: (eventoFull.paciente_nome as string) ?? id,
    justificativa,
    documentacao_url: arquivoUrl,
    payload: JSON.stringify({ antes: eventoFull, depois }),
  }).execute()
}

// POST /eventos/:id/reverter — soft delete com upload de arquivo opcional
eventosRouter.post('/:id/reverter', upload.single('arquivo'), async (req, res) => {
  const id = req.params.id as string
  const justificativa = String(req.body?.justificativa ?? '')

  if (!justificativa.trim()) {
    res.status(400).json({ error: 'Justificativa obrigatória para reverter evento' })
    return
  }

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null
  await softDeleteEvento(id, justificativa, arquivoUrl, req)
  res.status(204).end()
})

// DELETE /eventos/:id — soft delete com arquivo opcional
eventosRouter.delete('/:id', upload.single('arquivo'), async (req, res) => {
  const id = req.params.id as string
  const justificativa = String(req.body?.justificativa ?? '')

  if (!justificativa.trim()) {
    res.status(400).json({ error: 'Justificativa obrigatória para remover evento' })
    return
  }

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null
  await softDeleteEvento(id, justificativa, arquivoUrl, req)
  res.status(204).end()
})

// POST /eventos/re-registrar — reativa evento desativado a partir do audit_log
eventosRouter.post('/re-registrar', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { audit_id, justificativa } = req.body as { audit_id?: string; justificativa?: string }

  if (!audit_id?.trim()) {
    res.status(400).json({ error: 'audit_id é obrigatório' })
    return
  }
  if (!justificativa?.trim()) {
    res.status(400).json({ error: 'Justificativa obrigatória para re-registrar evento' })
    return
  }

  // Buscar dados originais do audit_log
  const auditEntry = await db
    .selectFrom('audit_log')
    .select(['entidade_id', 'campo_alterado', 'valor_novo'])
    .where('id', '=', audit_id)
    .where('acao', '=', 'excluir')
    .executeTakeFirst()

  if (!auditEntry || !auditEntry.campo_alterado) {
    res.status(404).json({ error: 'Entrada de auditoria não encontrada ou sem tipo de evento' })
    return
  }

  // Tentar reativar o evento existente (soft-deleted) primeiro
  const existing = await db
    .selectFrom('eventos_pacientes')
    .selectAll()
    .where('id', '=', auditEntry.entidade_id)
    .where('ativo', '=', false)
    .executeTakeFirst()

  const tipoEvento = auditEntry.campo_alterado
  const nomePaciente = auditEntry.valor_novo
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1
  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null

  if (existing) {
    // Reativar o evento soft-deleted
    await db.updateTable('eventos_pacientes')
      .set({ ativo: true })
      .where('id', '=', existing.id)
      .execute()

    await incrementarMetrica(db, tipoEvento, existing.ano ?? ano, existing.mes ?? mes, 1)

    await db.insertInto('audit_log').values({
      id: uuid(),
      entidade: 'evento_paciente',
      entidade_id: existing.id,
      acao: 'criar',
      usuario_email: getRequestEmail(req),
      campo_alterado: tipoEvento,
      valor_novo: nomePaciente,
      justificativa: `Re-registro: ${justificativa}`,
      documentacao_url: arquivoUrl,
    }).execute()

    const reactivated = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', existing.id).executeTakeFirst()
    res.status(201).json(reactivated)
    return
  }

  // Fallback: criar novo evento se o original foi perdido
  const paciente = await db
    .selectFrom('pacientes')
    .select(['id', 'convenio'])
    .where('nome', '=', nomePaciente as string)
    .executeTakeFirst()

  if (!paciente) {
    res.status(404).json({ error: `Paciente "${nomePaciente}" não encontrado` })
    return
  }

  const newId = uuid()

  await db.insertInto('eventos_pacientes').values({
    id: newId,
    paciente_id: paciente.id,
    tipo_evento: tipoEvento,
    ano,
    mes,
    data_evento: new Date().toISOString().slice(0, 10),
    observacao_texto: `Re-registrado: ${justificativa}`,
    documentacao_url: arquivoUrl,
  }).execute()

  await incrementarMetrica(db, tipoEvento, ano, mes, 1)

  await db.insertInto('audit_log').values({
    id: uuid(),
    entidade: 'evento_paciente',
    entidade_id: newId,
    acao: 'criar',
    usuario_email: getRequestEmail(req),
    campo_alterado: tipoEvento,
    valor_novo: nomePaciente,
    justificativa: `Re-registro: ${justificativa}`,
    documentacao_url: arquivoUrl,
  }).execute()

  const created = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', newId).executeTakeFirst()
  res.status(201).json(created)
})

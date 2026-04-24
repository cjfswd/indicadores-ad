import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { sql } from 'kysely'
import { now } from '../lib/sql-helpers.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { incrementarMetrica } from '../lib/campo-map.js'
import type { AuditAcao } from '../config/db.schema.js'

export const auditoriaRouter = Router()

// ── Upload config ──
const UPLOAD_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// ── GET / — listar auditoria ──
auditoriaRouter.get('/', async (req, res) => {
  const db = getKysely()

  let baseQuery = db.selectFrom('audit_log')

  if (req.query.entidade) baseQuery = baseQuery.where('entidade', '=', req.query.entidade as string)
  if (req.query.acao) baseQuery = baseQuery.where('acao', '=', req.query.acao as string as AuditAcao)
  if (req.query.entidade_id) baseQuery = baseQuery.where('entidade_id', '=', req.query.entidade_id as string)
  if (req.query.inicio) baseQuery = baseQuery.where('timestamp', '>=', req.query.inicio as string)
  if (req.query.fim) baseQuery = baseQuery.where('timestamp', '<=', req.query.fim as string)

  const countResult = await baseQuery
    .select(({ fn }) => fn.countAll<number>().as('total'))
    .executeTakeFirstOrThrow()
  const total = countResult.total

  const pagina = Math.max(1, Number(req.query.pagina) || 1)
  const porPagina = Math.min(100, Math.max(1, Number(req.query.por_pagina) || 20))

  const rows = await baseQuery
    .selectAll()
    .orderBy('timestamp desc')
    .limit(porPagina)
    .offset((pagina - 1) * porPagina)
    .execute()

  res.json({
    dados: rows,
    paginacao: { pagina_atual: pagina, por_pagina: porPagina, total_registros: total, total_paginas: Math.ceil(total / porPagina) },
  })
})

auditoriaRouter.get('/:entidade/:id', async (req, res) => {
  const db = getKysely()

  const rows = await db
    .selectFrom('audit_log')
    .selectAll()
    .where('entidade', '=', req.params.entidade)
    .where('entidade_id', '=', req.params.id)
    .orderBy('timestamp desc')
    .execute()

  res.json({ dados: rows })
})

// ── POST /:id/reverter — reverter QUALQUER ação do audit_log ──
auditoriaRouter.post('/:id/reverter', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const justificativa = String(req.body?.justificativa ?? '')

  if (!justificativa.trim()) {
    res.status(400).json({ error: 'Justificativa obrigatória' })
    return
  }

  const entry = await db
    .selectFrom('audit_log')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!entry) {
    res.status(404).json({ error: 'Entrada de auditoria não encontrada' })
    return
  }

  // ── Validação: não reverter duas vezes ──
  if (entry.revertido) {
    res.status(409).json({ error: 'Esta ação já foi revertida anteriormente' })
    return
  }

  // ── Validação: não reverter uma reversão ──
  if (entry.acao.startsWith('reverter')) {
    res.status(400).json({ error: 'Não é possível reverter uma reversão. Refaça a ação original.' })
    return
  }

  const arquivoUrl = req.file ? `/uploads/${req.file.filename}` : null
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1

  // ── Executar reversão + capturar snapshots ──
  let entityBefore: unknown = null
  let entityAfter: unknown = null

  if (entry.entidade === 'evento_paciente') {
    if (entry.acao === 'criar') {
      // Reverter criação → soft delete (ativo = 0)
      entityBefore = await db
        .selectFrom('eventos_pacientes as e')
        .leftJoin('pacientes as p', 'p.id', 'e.paciente_id')
        .select([
          'e.id', 'e.paciente_id', 'e.ano', 'e.mes', 'e.tipo_evento', 'e.ativo',
          'p.nome as paciente_nome',
        ])
        .where('e.id', '=', entry.entidade_id)
        .executeTakeFirst()

      if (entityBefore) {
        const ev = entityBefore as { tipo_evento: string; ano: number; mes: number; ativo: number }
        if (ev.ativo === 1) {
          await incrementarMetrica(db, ev.tipo_evento, ev.ano, ev.mes, -1)
          await db.updateTable('eventos_pacientes')
            .set({ ativo: 0 })
            .where('id', '=', entry.entidade_id)
            .execute()
        }
        entityAfter = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()
      }
    } else if (entry.acao === 'excluir') {
      // Reverter exclusão → reativar (ativo = 1)
      entityBefore = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()

      if (entityBefore) {
        // Reativar evento soft-deleted
        const ev = entityBefore as { tipo_evento: string; ano: number; mes: number; ativo: number }
        if (ev.ativo === 0) {
          await db.updateTable('eventos_pacientes')
            .set({ ativo: 1 })
            .where('id', '=', entry.entidade_id)
            .execute()
          await incrementarMetrica(db, ev.tipo_evento, ev.ano ?? ano, ev.mes ?? mes, 1)
        }
        entityAfter = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()
      } else {
        // Evento foi perdido — criar novo a partir do campo_alterado/valor_novo
        const tipoEvento = entry.campo_alterado
        const nomePaciente = entry.valor_novo
        entityBefore = null

        if (tipoEvento && nomePaciente) {
          const paciente = await db.selectFrom('pacientes').select('id').where('nome', '=', nomePaciente).executeTakeFirst()
          if (paciente) {
            const newId = uuid()
            await db.insertInto('eventos_pacientes').values({
              id: newId,
              paciente_id: paciente.id,
              tipo_evento: tipoEvento,
              ano,
              mes,
              data_evento: new Date().toISOString().slice(0, 10),
              observacao_texto: `Re-registrado via auditoria: ${justificativa}`,
              documentacao_url: arquivoUrl,
            }).execute()
            await incrementarMetrica(db, tipoEvento, ano, mes, 1)
            entityAfter = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', newId).executeTakeFirst()
          }
        }
      }
    }
  }

  if (entry.entidade === 'paciente') {
    entityBefore = await db.selectFrom('pacientes').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()

    if (entry.acao === 'criar') {
      // Reverter criação → soft delete
      if (entityBefore) {
        await db.updateTable('pacientes')
          .set({ ativo: 0, atualizado_em: now() } as never)
          .where('id', '=', entry.entidade_id)
          .execute()
      }
    } else if (entry.acao === 'excluir') {
      if (entityBefore) {
        // Paciente existe (soft-deleted) → reativar
        await db.updateTable('pacientes')
          .set({ ativo: 1, atualizado_em: now() } as never)
          .where('id', '=', entry.entidade_id)
          .execute()
        // Reativar eventos do paciente
        await db.updateTable('eventos_pacientes')
          .set({ ativo: 1 })
          .where('paciente_id', '=', entry.entidade_id)
          .execute()
      } else {
        // Paciente totalmente perdido → re-inserir usando payload
        const payloadData = entry.payload ? JSON.parse(entry.payload) : null
        const pacData = payloadData?.antes ?? payloadData
        if (pacData?.nome) {
          await db.insertInto('pacientes').values({
            id: entry.entidade_id,
            nome: pacData.nome,
            data_nascimento: pacData.data_nascimento ?? null,
            convenio: pacData.convenio ?? 'Camperj',
            modalidade: pacData.modalidade ?? 'AD',
            observacoes: pacData.observacoes ?? null,
          }).execute()
        } else if (entry.valor_novo) {
          await db.insertInto('pacientes').values({
            id: entry.entidade_id,
            nome: entry.valor_novo,
            convenio: 'Camperj',
            modalidade: 'AD',
          }).execute()
        }
      }
    } else if (entry.acao === 'editar' && entry.valor_anterior) {
      await db.updateTable('pacientes')
        .set({ nome: entry.valor_anterior, atualizado_em: now() } as never)
        .where('id', '=', entry.entidade_id)
        .execute()
    }

    entityAfter = await db.selectFrom('pacientes').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()
  }

  if (entry.entidade === 'meta') {
    entityBefore = await db
      .selectFrom('metas')
      .selectAll()
      .where('indicador_codigo', '=', entry.entidade_id)
      .executeTakeFirst()

    if ((entry.acao === 'editar' || entry.acao === 'criar') && entry.valor_anterior) {
      try {
        const prev = JSON.parse(entry.valor_anterior) as { meta: number | null; alerta: number | null }
        await db.updateTable('metas')
          .set({
            meta_valor: prev.meta,
            limite_alerta: prev.alerta,
            atualizado_em: now(),
          } as never)
          .where('indicador_codigo', '=', entry.entidade_id)
          .execute()
      } catch {
        // valor_anterior não é JSON válido
      }
    }

    entityAfter = await db
      .selectFrom('metas')
      .selectAll()
      .where('indicador_codigo', '=', entry.entidade_id)
      .executeTakeFirst()
  }

  if (entry.entidade === 'registro_mensal' && entry.acao === 'confirmar') {
    entityBefore = await db.selectFrom('registros_mensais').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()

    if (entityBefore) {
      await db.updateTable('registros_mensais')
        .set({ status: 'rascunho', atualizado_em: now() } as never)
        .where('id', '=', entry.entidade_id)
        .execute()
    }

    entityAfter = await db.selectFrom('registros_mensais').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()
  }

  // ── Registrar reversão com linking bidirecional ──
  const reversalId = uuid()
  const acaoRevertida = entry.acao === 'criar' ? 'reverter_criacao' as const
    : entry.acao === 'excluir' ? 'reverter_exclusao' as const
    : entry.acao === 'confirmar' ? 'reverter_confirmacao' as const
    : 'reverter_edicao' as const

  const reversalPayload = JSON.stringify({
    original_entry: {
      id: entry.id, entidade: entry.entidade, entidade_id: entry.entidade_id, acao: entry.acao,
      campo_alterado: entry.campo_alterado, valor_anterior: entry.valor_anterior, valor_novo: entry.valor_novo,
    },
    antes: entityBefore,
    depois: entityAfter,
    justificativa,
  })

  await db.insertInto('audit_log').values({
    id: reversalId,
    entidade: entry.entidade,
    entidade_id: entry.entidade_id,
    acao: acaoRevertida,
    usuario_email: getRequestEmail(req),
    campo_alterado: entry.campo_alterado,
    valor_anterior: entry.valor_novo,
    valor_novo: entry.valor_anterior,
    justificativa,
    documentacao_url: arquivoUrl,
    reverte_ref: entry.id,
    payload: reversalPayload,
  }).execute()

  // Marcar entrada original como revertida
  await db.updateTable('audit_log')
    .set({ revertido: 1, revertido_por: reversalId })
    .where('id', '=', entry.id)
    .execute()

  res.json({
    message: 'Ação revertida com sucesso',
    acao_original: entry.acao,
    entidade: entry.entidade,
    reversal_id: reversalId,
    original_id: entry.id,
  })
})

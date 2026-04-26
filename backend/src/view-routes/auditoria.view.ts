import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getKysely } from '../config/database.js'
import { getRequestEmail } from '../lib/request-user.js'
import { now } from '../lib/sql-helpers.js'
import { incrementarMetrica } from '../lib/campo-map.js'
import { renderAuditoriaTable } from '../renderers/auditoria.renderer.js'

export const auditoriaViewRouter = Router()

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



const POR_PAGINA = 20

async function loadAuditData(db: ReturnType<typeof getKysely>, opts: {
  pagina?: number; filtroEntidade?: string; filtroAcao?: string
}) {
  const pagina = opts.pagina ?? 1
  let countQuery = db.selectFrom('audit_log').select(db.fn.count('id').as('total'))
  let query = db.selectFrom('audit_log').selectAll()

  if (opts.filtroEntidade) {
    countQuery = countQuery.where('entidade', '=', opts.filtroEntidade)
    query = query.where('entidade', '=', opts.filtroEntidade)
  }
  if (opts.filtroAcao) {
    countQuery = countQuery.where('acao', '=', opts.filtroAcao as never)
    query = query.where('acao', '=', opts.filtroAcao as never)
  }

  const [{ total: totalRaw }] = await countQuery.execute()
  const total = Number(totalRaw)
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const offset = (pagina - 1) * POR_PAGINA

  const logs = await query.orderBy('timestamp', 'desc').limit(POR_PAGINA).offset(offset).execute()

  return { logs, total, pagina, totalPaginas, filtroEntidade: opts.filtroEntidade ?? '', filtroAcao: opts.filtroAcao ?? '' }
}

// GET /auditoria — full page
auditoriaViewRouter.get('/', async (req, res) => {
  const db = getKysely()
  const data = await loadAuditData(db, {
    pagina: Number(req.query.pagina) || 1,
    filtroEntidade: req.query.filtroEntidade as string | undefined,
    filtroAcao: req.query.filtroAcao as string | undefined,
  })
  const content = renderAuditoriaTable(data)
  res.render('auditoria', { title: 'Auditoria', currentPath: '/auditoria', content, ...data })
})

// GET /auditoria/content — HTMX partial
auditoriaViewRouter.get('/content', async (req, res) => {
  const db = getKysely()
  const data = await loadAuditData(db, {
    pagina: Number(req.query.pagina) || 1,
    filtroEntidade: req.query.filtroEntidade as string | undefined,
    filtroAcao: req.query.filtroAcao as string | undefined,
  })
  res.send(renderAuditoriaTable(data))
})

// GET /auditoria/:id/modal/reverter — revert confirm modal
auditoriaViewRouter.get('/:id/modal/reverter', async (req, res) => {
  const db = getKysely()
  const entry = await db.selectFrom('audit_log').select(['id', 'acao', 'entidade']).where('id', '=', req.params.id).executeTakeFirst()
  if (!entry) { res.status(404).send('Não encontrado'); return }
  res.render('modals/auditoria-reverter', { layout: false, id: entry.id, acao: entry.acao, entidade: entry.entidade })
})

// POST /auditoria/:id/reverter — generic reversal handler
auditoriaViewRouter.post('/:id/reverter', upload.single('arquivo'), async (req, res) => {
  const db = getKysely()
  const { id } = req.params
  const justificativa = String(req.body?.justificativa ?? '')
  if (!justificativa.trim()) { res.status(400).send('Justificativa obrigatória'); return }

  const entry = await db.selectFrom('audit_log').selectAll().where('id', '=', id).executeTakeFirst()
  if (!entry) { res.status(404).send('Entrada não encontrada'); return }
  if (entry.revertido) { res.status(400).send('Já revertido'); return }

  const email = getRequestEmail(req)
  let payload: Record<string, unknown> | null = null
  try { if (entry.payload) payload = JSON.parse(entry.payload) } catch { /* ignore */ }

  // Mark original as reverted
  await db.updateTable('audit_log').set({ revertido: true, revertido_por: email }).where('id', '=', id).execute()

  // Apply reversal logic based on entity + action
  if (entry.entidade === 'paciente') {
    if (entry.acao === 'criar') {
      // Reverter criação = excluir paciente
      await db.updateTable('pacientes').set({ status: 'excluido' as const, atualizado_em: now() }).where('id', '=', entry.entidade_id).execute()
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'paciente', entidade_id: entry.entidade_id,
        acao: 'reverter_criacao', usuario_email: email, justificativa,
        valor_novo: entry.valor_novo, reverte_ref: id,
        payload: JSON.stringify({ original_entry: entry }),
      }).execute()
    } else if (entry.acao === 'excluir' || entry.acao === 'desativar') {
      // Reverter exclusão/desativação = reativar
      await db.updateTable('pacientes').set({
        status: 'ativo' as const, motivo_desativacao: null,
        indicador_desativacao: null, atualizado_em: now(),
      }).where('id', '=', entry.entidade_id).execute()
      const acao = entry.acao === 'desativar' ? 'reverter_desativacao' : 'reverter_exclusao'
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'paciente', entidade_id: entry.entidade_id,
        acao: acao as never, usuario_email: email, justificativa,
        valor_novo: entry.valor_anterior ?? entry.valor_novo, reverte_ref: id,
      }).execute()
    } else if (entry.acao === 'editar' && payload?.antes) {
      const antes = payload.antes as Record<string, unknown>
      await db.updateTable('pacientes').set({
        nome: antes.nome as string, convenio: antes.convenio as 'Camperj' | 'Unimed',
        modalidade: antes.modalidade as 'AD' | 'ID',
        data_nascimento: (antes.data_nascimento as string) ?? null,
        observacoes: (antes.observacoes as string) ?? null, atualizado_em: now(),
      }).where('id', '=', entry.entidade_id).execute()
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'paciente', entidade_id: entry.entidade_id,
        acao: 'reverter_edicao', usuario_email: email, justificativa,
        valor_novo: antes.nome as string, reverte_ref: id,
      }).execute()
    } else if (entry.acao === 'reativar') {
      await db.updateTable('pacientes').set({ status: 'inativo' as const, atualizado_em: now() }).where('id', '=', entry.entidade_id).execute()
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'paciente', entidade_id: entry.entidade_id,
        acao: 'reverter_reativacao', usuario_email: email, justificativa, reverte_ref: id,
      }).execute()
    }
  } else if (entry.entidade === 'evento_paciente') {
    if (entry.acao === 'criar') {
      await db.updateTable('eventos_pacientes').set({ status: 'excluido' as const }).where('id', '=', entry.entidade_id).execute()
      if (entry.campo_alterado) {
        const ev = await db.selectFrom('eventos_pacientes').select(['ano', 'mes']).where('id', '=', entry.entidade_id).executeTakeFirst()
        if (ev) await incrementarMetrica(db, entry.campo_alterado, ev.ano ?? 0, ev.mes ?? 0, -1)
      }
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'evento_paciente', entidade_id: entry.entidade_id,
        acao: 'reverter_criacao', usuario_email: email, justificativa,
        campo_alterado: entry.campo_alterado, reverte_ref: id,
      }).execute()
    } else if (entry.acao === 'excluir') {
      await db.updateTable('eventos_pacientes').set({ status: 'ativo' as const }).where('id', '=', entry.entidade_id).execute()
      if (entry.campo_alterado) {
        const ev = await db.selectFrom('eventos_pacientes').select(['ano', 'mes']).where('id', '=', entry.entidade_id).executeTakeFirst()
        if (ev) await incrementarMetrica(db, entry.campo_alterado, ev.ano ?? 0, ev.mes ?? 0, +1)
      }
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'evento_paciente', entidade_id: entry.entidade_id,
        acao: 'reverter_exclusao', usuario_email: email, justificativa,
        campo_alterado: entry.campo_alterado, reverte_ref: id,
      }).execute()
    }
  } else if (entry.entidade === 'registro_mensal') {
    if (entry.acao === 'confirmar') {
      await db.updateTable('registros_mensais').set({ status: 'rascunho', atualizado_em: now() }).where('id', '=', entry.entidade_id).execute()
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'registro_mensal', entidade_id: entry.entidade_id,
        acao: 'reverter_confirmacao', usuario_email: email, justificativa, reverte_ref: id,
        payload: entry.payload,
      }).execute()
    }
  } else if (entry.entidade === 'meta') {
    if (entry.acao === 'editar' && payload?.antes) {
      const antes = payload.antes as Record<string, unknown>
      await db.updateTable('metas').set({
        meta_valor: (antes.meta_valor as number) ?? null,
        limite_alerta: (antes.limite_alerta as number) ?? null,
        sentido: (antes.sentido as 'maior' | 'menor' | 'neutro') ?? 'menor',
        atualizado_em: now(),
      }).where('id', '=', entry.entidade_id).execute()
      await db.insertInto('audit_log').values({
        id: uuid(), entidade: 'meta', entidade_id: entry.entidade_id,
        acao: 'reverter_edicao', usuario_email: email, justificativa, reverte_ref: id,
      }).execute()
    }
  }

  const data = await loadAuditData(db, { pagina: 1 })
  triggerToast(res, 'Ação revertida')
  res.send(renderAuditoriaTable(data))
})

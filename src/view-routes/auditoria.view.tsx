import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { MainLayout } from '../views/layouts/MainLayout.js'
import { AuditoriaPage } from '../views/pages/AuditoriaPage.js'
import { AuditoriaTable } from '../views/partials/AuditoriaTable.js'
import { AuditoriaReverter } from '../views/modals/MetaAuditoriaModals.js'
import { getKysely } from '../config/database.js'
import { incrementarMetrica } from '../lib/campo-map.js'
import type { AuditAcao } from '../config/db.schema.js'

export const auditoriaViewRoutes = new Hono()

function triggerToast(c: { header: (k: string, v: string) => void }, message: string) {
  c.header('HX-Trigger', JSON.stringify({ showToast: { message } }))
}

const PAGE_SIZE = 20

async function loadAuditData(db: ReturnType<typeof getKysely>, opts: { pagina?: number; filtroEntidade?: string; filtroAcao?: string }) {
  const pagina = opts.pagina ?? 1
  let countQ = db.selectFrom('audit_log').select(db.fn.count('id').as('total'))
  let query = db.selectFrom('audit_log').selectAll()
  if (opts.filtroEntidade) { countQ = countQ.where('entidade', '=', opts.filtroEntidade); query = query.where('entidade', '=', opts.filtroEntidade) }
  if (opts.filtroAcao) { countQ = countQ.where('acao', '=', opts.filtroAcao as AuditAcao); query = query.where('acao', '=', opts.filtroAcao as AuditAcao) }
  const { total } = await countQ.executeTakeFirstOrThrow() as { total: number }
  const totalPaginas = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE))
  const logs = await query.orderBy('timestamp', 'desc').limit(PAGE_SIZE).offset((pagina - 1) * PAGE_SIZE).execute()
  return { logs: logs as Array<Record<string, unknown>>, pagina, totalPaginas }
}

auditoriaViewRoutes.get('/', (c) => c.html(<MainLayout title="Auditoria" currentPath="/auditoria"><AuditoriaPage /></MainLayout>))

auditoriaViewRoutes.get('/content', async (c) => {
  const db = getKysely()
  const data = await loadAuditData(db, {
    pagina: Number(c.req.query('pagina')) || 1,
    filtroEntidade: c.req.query('filtroEntidade') || undefined,
    filtroAcao: c.req.query('filtroAcao') || undefined,
  })
  return c.html(<AuditoriaTable logs={data.logs as any} pagina={data.pagina} totalPaginas={data.totalPaginas} />)
})

auditoriaViewRoutes.get('/:id/modal/reverter', async (c) => {
  const db = getKysely()
  const entry = await db.selectFrom('audit_log').select(['id', 'acao', 'entidade']).where('id', '=', c.req.param('id')).executeTakeFirst()
  if (!entry) return c.text('Não encontrado', 404)
  return c.html(<AuditoriaReverter id={entry.id} acao={entry.acao} entidade={entry.entidade} />)
})

auditoriaViewRoutes.post('/:id/reverter', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const id = c.req.param('id')
  const justificativa = (body['justificativa'] as string) || null
  const entry = await db.selectFrom('audit_log').selectAll().where('id', '=', id).executeTakeFirst()
  if (!entry) return c.text('Não encontrado', 404)

  const reversalId = uuid()
  await db.updateTable('audit_log').set({ revertido: true } as Record<string, unknown>).where('id', '=', id).execute()

  // Reversal logic based on entity type
  if (entry.entidade === 'evento_paciente') {
    if (entry.acao === 'criar') {
      await db.updateTable('eventos_pacientes').set({ status: 'excluido' as const }).where('id', '=', entry.entidade_id).execute()
      const ev = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', entry.entidade_id).executeTakeFirst()
      if (ev) {
        const reg = await db.selectFrom('registros_mensais').selectAll()
          .where('ano', '=', (ev as Record<string, unknown>).ano as number)
          .where('mes', '=', (ev as Record<string, unknown>).mes as number).executeTakeFirst()
        if (reg) {
          await incrementarMetrica(db, (ev as Record<string, unknown>).tipo_evento as string, (ev as Record<string, unknown>).ano as number, (ev as Record<string, unknown>).mes as number, -1)
        }
      }
    }
  } else if (entry.entidade === 'paciente') {
    try {
      const payload = JSON.parse(entry.payload ?? '{}')
      if (entry.acao === 'criar') await db.updateTable('pacientes').set({ status: 'excluido' as const }).where('id', '=', entry.entidade_id).execute()
      else if (entry.acao === 'excluir') await db.updateTable('pacientes').set({ status: 'ativo' as const }).where('id', '=', entry.entidade_id).execute()
      else if (entry.acao === 'desativar') await db.updateTable('pacientes').set({ status: 'ativo' as const, motivo_desativacao: null, indicador_desativacao: null }).where('id', '=', entry.entidade_id).execute()
      else if (entry.acao === 'reativar') await db.updateTable('pacientes').set({ status: 'inativo' as const, motivo_desativacao: payload?.antes?.motivo_desativacao ?? null }).where('id', '=', entry.entidade_id).execute()
      else if (entry.acao === 'editar' && payload?.antes) {
        const { nome, convenio, modalidade, data_nascimento, observacoes } = payload.antes
        await db.updateTable('pacientes').set({ nome, convenio, modalidade, data_nascimento, observacoes }).where('id', '=', entry.entidade_id).execute()
      }
    } catch { /* empty */ }
  } else if (entry.entidade === 'registro_mensal' && entry.acao === 'confirmar') {
    await db.updateTable('registros_mensais').set({ confirmado: false } as Record<string, unknown>).where('id', '=', entry.entidade_id).execute()
  }

  await db.insertInto('audit_log').values({
    id: reversalId, entidade: entry.entidade, entidade_id: entry.entidade_id,
    acao: `reverter_${entry.acao}` as AuditAcao, justificativa, reverte_ref: id,
    payload: entry.payload,
  }).execute()

  const data = await loadAuditData(db, { pagina: 1 })
  triggerToast(c, 'Ação revertida')
  return c.html(<AuditoriaTable logs={data.logs as any} pagina={data.pagina} totalPaginas={data.totalPaginas} />)
})

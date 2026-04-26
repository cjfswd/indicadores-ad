import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { MainLayout } from '../views/layouts/MainLayout.js'
import { RegistrosPage } from '../views/pages/RegistrosPage.js'
import { RegistroDetail } from '../views/partials/RegistroDetail.js'
import { EventoForm, EventoExcluir } from '../views/modals/EventoModals.js'
import { getKysely } from '../config/database.js'
import { TIPO_EVENTO_LABELS } from '../views/helpers.js'
import { incrementarMetrica } from '../lib/campo-map.js'

export const registrosViewRoutes = new Hono()

function triggerToast(c: { header: (k: string, v: string) => void }, message: string) {
  c.header('HX-Trigger', JSON.stringify({ showToast: { message } }))
}

async function loadRegistroData(db: ReturnType<typeof getKysely>, ano: number, mes: number) {
  let registro = await db.selectFrom('registros_mensais').selectAll().where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()
  if (!registro) {
    const id = uuid()
    const defaults = { id, ano, mes, pacientes_total: 0, pacientes_ad: 0, pacientes_id: 0 } as any
    await db.insertInto('registros_mensais').values(defaults).execute()
    registro = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
  }
  const eventos = await db.selectFrom('eventos_pacientes as e')
    .leftJoin('pacientes as p', 'p.id', 'e.paciente_id')
    .select(['e.id', 'e.tipo_evento', 'e.data_evento', 'e.descricao', 'p.nome as paciente_nome'])
    .where('e.ano', '=', ano).where('e.mes', '=', mes).where('e.status', '=', 'ativo')
    .orderBy('e.criado_em', 'desc').execute()
  return { registro: registro as Record<string, unknown>, ano, mes, eventos }
}

registrosViewRoutes.get('/', (c) => c.html(<MainLayout title="Registros" currentPath="/registros"><RegistrosPage /></MainLayout>))

registrosViewRoutes.get('/content', async (c) => {
  const db = getKysely()
  const hoje = new Date()
  const ano = Number(c.req.query('regAno') || c.req.query('ano')) || hoje.getFullYear()
  const mes = Number(c.req.query('regMes') || c.req.query('mes')) || (hoje.getMonth() + 1)
  const data = await loadRegistroData(db, ano, mes)
  return c.html(<RegistroDetail {...data} />)
})

registrosViewRoutes.get('/modal/evento', async (c) => {
  const db = getKysely()
  const tipoEvento = c.req.query('tipo') ?? ''
  const label = c.req.query('label') ?? TIPO_EVENTO_LABELS[tipoEvento] ?? tipoEvento
  const ano = Number(c.req.query('ano'))
  const mes = Number(c.req.query('mes'))
  const pacientes = await db.selectFrom('pacientes').selectAll().where('status', '=', 'ativo').orderBy('nome').execute()
  return c.html(<EventoForm tipoEvento={tipoEvento} label={label} ano={ano} mes={mes} pacientes={pacientes} />)
})

registrosViewRoutes.get('/modal/excluir-evento/:id', (c) => c.html(<EventoExcluir id={c.req.param('id')} />))

registrosViewRoutes.post('/eventos', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const tipoEvento = body['tipo_evento'] as string
  const ano = Number(body['ano']); const mes = Number(body['mes'])
  const eventoId = uuid()
  await (db.insertInto('eventos_pacientes').values({
    id: eventoId, tipo_evento: tipoEvento, paciente_id: body['paciente_id'] as string,
    ano, mes, data_evento: (body['data_evento'] as string) || null, descricao: (body['descricao'] as string) || null,
  } as any) as any).execute()
  let registro = await db.selectFrom('registros_mensais').selectAll().where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()
  if (!registro) {
    const regId = uuid()
    await (db.insertInto('registros_mensais').values({ id: regId, ano, mes } as any) as any).execute()
    registro = await db.selectFrom('registros_mensais').selectAll().where('id', '=', regId).executeTakeFirstOrThrow()
  }
  await incrementarMetrica(db, tipoEvento, ano, mes, 1)
  const paciente = await db.selectFrom('pacientes').select(['nome']).where('id', '=', body['paciente_id'] as string).executeTakeFirst()
  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'evento_paciente', entidade_id: eventoId, acao: 'criar',
    campo_alterado: tipoEvento, valor_novo: paciente?.nome ?? '',
    payload: JSON.stringify({ nome: paciente?.nome, tipo: tipoEvento, ano, mes }),
  }).execute()
  const data = await loadRegistroData(db, ano, mes)
  triggerToast(c, 'Evento registrado!')
  return c.html(<RegistroDetail {...data} />)
})

registrosViewRoutes.post('/eventos/:id/reverter', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const id = c.req.param('id')
  const evento = await db.selectFrom('eventos_pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!evento) return c.text('Não encontrado', 404)
  await db.updateTable('eventos_pacientes').set({ status: 'excluido' as const }).where('id', '=', id).execute()
  const registro = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', (evento as Record<string, unknown>).ano as number)
    .where('mes', '=', (evento as Record<string, unknown>).mes as number).executeTakeFirst()
  if (registro) {
    await incrementarMetrica(db, (evento as Record<string, unknown>).tipo_evento as string, (evento as Record<string, unknown>).ano as number, (evento as Record<string, unknown>).mes as number, -1)
  }
  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'evento_paciente', entidade_id: id, acao: 'excluir',
    campo_alterado: (evento as Record<string, unknown>).tipo_evento as string,
    justificativa: (body['justificativa'] as string) || null,
  }).execute()
  const data = await loadRegistroData(db, (evento as Record<string, unknown>).ano as number, (evento as Record<string, unknown>).mes as number)
  triggerToast(c, 'Evento removido')
  return c.html(<RegistroDetail {...data} />)
})

registrosViewRoutes.put('/:id/confirmar', async (c) => {
  const db = getKysely()
  const id = c.req.param('id')
  const antes = await db.selectFrom('registros_mensais').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) return c.text('Não encontrado', 404)
  await db.updateTable('registros_mensais').set({ confirmado: true } as Record<string, unknown>).where('id', '=', id).execute()
  await db.insertInto('audit_log').values({
    id: uuid(), entidade: 'registro_mensal', entidade_id: id, acao: 'confirmar',
    payload: JSON.stringify({ antes }),
  }).execute()
  const data = await loadRegistroData(db, (antes as Record<string, unknown>).ano as number, (antes as Record<string, unknown>).mes as number)
  triggerToast(c, 'Mês confirmado!')
  return c.html(<RegistroDetail {...data} />)
})

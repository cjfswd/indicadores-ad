import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { MainLayout } from '../views/layouts/MainLayout.js'
import { PacientesPage } from '../views/pages/PacientesPage.js'
import { PacientesList } from '../views/partials/PacientesList.js'
import { PacienteForm } from '../views/modals/PacienteForm.js'
import { PacienteDesativar, PacienteExcluir } from '../views/modals/PacienteActions.js'
import { getKysely } from '../config/database.js'

export const pacientesViewRoutes = new Hono()

function triggerToast(c: { header: (k: string, v: string) => void }, message: string) {
  c.header('HX-Trigger', JSON.stringify({ showToast: { message } }))
}

async function loadGrouped(db: ReturnType<typeof getKysely>, filtroStatus = 'ativo', busca?: string, filtroConvenio?: string) {
  let query = db.selectFrom('pacientes').selectAll()
  if (filtroStatus === 'todos') query = query.where('status', '!=', 'excluido')
  else if (filtroStatus === 'inativo') query = query.where('status', '=', 'inativo')
  else query = query.where('status', '=', 'ativo')
  if (filtroConvenio && filtroConvenio !== 'todos') query = query.where('convenio', '=', filtroConvenio as 'Camperj' | 'Unimed')
  if (busca) query = query.where('nome', 'like', `%${busca}%`)
  const pacientes = await query.orderBy('convenio').orderBy('nome').execute()
  const agrupados: Record<string, typeof pacientes> = {}
  for (const p of pacientes) { if (!agrupados[p.convenio]) agrupados[p.convenio] = []; agrupados[p.convenio].push(p) }
  return agrupados
}

pacientesViewRoutes.get('/', (c) => c.html(<MainLayout title="Pacientes" currentPath="/pacientes"><PacientesPage /></MainLayout>))

pacientesViewRoutes.get('/content', async (c) => {
  const db = getKysely()
  const agrupados = await loadGrouped(db, c.req.query('filtroStatus') ?? 'ativo', c.req.query('busca'), c.req.query('filtroConvenio'))
  return c.html(<PacientesList agrupados={agrupados} />)
})

pacientesViewRoutes.get('/modal/novo', (c) => c.html(<PacienteForm />))

pacientesViewRoutes.get('/:id/modal/editar', async (c) => {
  const db = getKysely()
  const paciente = await db.selectFrom('pacientes').selectAll().where('id', '=', c.req.param('id')).executeTakeFirst()
  if (!paciente) return c.text('Não encontrado', 404)
  return c.html(<PacienteForm paciente={paciente} />)
})

pacientesViewRoutes.get('/:id/modal/desativar', async (c) => {
  const db = getKysely()
  const p = await db.selectFrom('pacientes').select(['id', 'nome']).where('id', '=', c.req.param('id')).executeTakeFirst()
  if (!p) return c.text('Não encontrado', 404)
  return c.html(<PacienteDesativar id={p.id} nome={p.nome} />)
})

pacientesViewRoutes.get('/:id/modal/excluir', (c) => c.html(<PacienteExcluir id={c.req.param('id')} />))

pacientesViewRoutes.post('/', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const id = uuid()
  await db.insertInto('pacientes').values({
    id, nome: body['nome'] as string, convenio: (body['convenio'] as string ?? 'Camperj') as 'Camperj' | 'Unimed',
    modalidade: (body['modalidade'] as string ?? 'AD') as 'AD' | 'ID', data_nascimento: (body['data_nascimento'] as string) || null,
    observacoes: (body['observacoes'] as string) || null,
  }).execute()
  await db.insertInto('audit_log').values({ id: uuid(), entidade: 'paciente', entidade_id: id, acao: 'criar', valor_novo: body['nome'] as string }).execute()
  triggerToast(c, 'Paciente cadastrado!')
  const agrupados = await loadGrouped(db, 'ativo')
  return c.html(<PacientesList agrupados={agrupados} />)
})

pacientesViewRoutes.put('/:id', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const id = c.req.param('id')
  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) return c.text('Não encontrado', 404)
  await db.updateTable('pacientes').set({
    nome: body['nome'] as string, convenio: body['convenio'] as 'Camperj' | 'Unimed', modalidade: body['modalidade'] as 'AD' | 'ID',
    data_nascimento: (body['data_nascimento'] as string) || null, observacoes: (body['observacoes'] as string) || null,
  }).where('id', '=', id).execute()
  await db.insertInto('audit_log').values({ id: uuid(), entidade: 'paciente', entidade_id: id, acao: 'editar', valor_anterior: antes.nome, valor_novo: body['nome'] as string, payload: JSON.stringify({ antes }) }).execute()
  triggerToast(c, 'Paciente atualizado!')
  return c.html(<PacientesList agrupados={await loadGrouped(db, 'ativo')} />)
})

pacientesViewRoutes.put('/:id/desativar', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const id = c.req.param('id')
  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) return c.text('Não encontrado', 404)
  await db.updateTable('pacientes').set({ status: 'inativo' as const, motivo_desativacao: (body['justificativa'] as string) ?? null, indicador_desativacao: (body['indicador'] as string) || null }).where('id', '=', id).execute()
  await db.insertInto('audit_log').values({ id: uuid(), entidade: 'paciente', entidade_id: id, acao: 'desativar', justificativa: (body['justificativa'] as string) || null, valor_anterior: antes.nome, payload: JSON.stringify({ antes }) }).execute()
  triggerToast(c, 'Paciente desativado')
  return c.html(<PacientesList agrupados={await loadGrouped(db, 'ativo')} />)
})

pacientesViewRoutes.put('/:id/reativar', async (c) => {
  const db = getKysely()
  const id = c.req.param('id')
  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) return c.text('Não encontrado', 404)
  await db.updateTable('pacientes').set({ status: 'ativo' as const, motivo_desativacao: null, indicador_desativacao: null }).where('id', '=', id).execute()
  await db.insertInto('audit_log').values({ id: uuid(), entidade: 'paciente', entidade_id: id, acao: 'reativar', valor_novo: antes.nome }).execute()
  triggerToast(c, 'Paciente reativado!')
  return c.html(<PacientesList agrupados={await loadGrouped(db, 'ativo')} />)
})

pacientesViewRoutes.post('/:id/excluir', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const id = c.req.param('id')
  const justificativa = body['justificativa'] as string
  if (!justificativa?.trim()) return c.text('Justificativa obrigatória', 400)
  const antes = await db.selectFrom('pacientes').selectAll().where('id', '=', id).executeTakeFirst()
  if (!antes) return c.text('Não encontrado', 404)
  await db.updateTable('pacientes').set({ status: 'excluido' as const }).where('id', '=', id).execute()
  await db.insertInto('audit_log').values({ id: uuid(), entidade: 'paciente', entidade_id: id, acao: 'excluir', justificativa, valor_anterior: antes.nome, payload: JSON.stringify({ antes }) }).execute()
  triggerToast(c, 'Paciente excluído')
  return c.html(<PacientesList agrupados={await loadGrouped(db, 'ativo')} />)
})

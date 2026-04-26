import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { MainLayout } from '../views/layouts/MainLayout.js'
import { MetasPage } from '../views/pages/MetasPage.js'
import { MetasTable } from '../views/partials/MetasTable.js'
import { MetaForm } from '../views/modals/MetaAuditoriaModals.js'
import { getKysely } from '../config/database.js'

export const metasViewRoutes = new Hono()

function triggerToast(c: { header: (k: string, v: string) => void }, message: string) {
  c.header('HX-Trigger', JSON.stringify({ showToast: { message } }))
}

metasViewRoutes.get('/', (c) => c.html(<MainLayout title="Metas" currentPath="/metas"><MetasPage /></MainLayout>))

metasViewRoutes.get('/content', async (c) => {
  const db = getKysely()
  const ano = Number(c.req.query('metasAno') || c.req.query('ano')) || new Date().getFullYear()
  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).orderBy('indicador_codigo').execute()
  return c.html(<MetasTable metas={metas} ano={ano} />)
})

metasViewRoutes.get('/modal/editar', async (c) => {
  const db = getKysely()
  const codigo = c.req.query('codigo')
  const ano = Number(c.req.query('ano')) || new Date().getFullYear()
  let meta = null
  if (codigo) {
    meta = await db.selectFrom('metas').selectAll().where('indicador_codigo', '=', codigo).where('ano', '=', ano).executeTakeFirst()
  }
  return c.html(<MetaForm meta={meta} ano={ano} />)
})

metasViewRoutes.put('/', async (c) => {
  const db = getKysely()
  const body = await c.req.parseBody()
  const indicador_codigo = body['indicador_codigo'] as string
  const ano = Number(body['ano']) || new Date().getFullYear()
  const meta_valor = body['meta_valor'] ? Number(body['meta_valor']) : null
  const limite_alerta = body['limite_alerta'] ? Number(body['limite_alerta']) : null
  const sentido = (body['sentido'] as string) || 'menor'
  const mes_inicio = Number(body['mes_inicio']) || 1
  const mes_fim = Number(body['mes_fim']) || 12

  const existing = await db.selectFrom('metas').selectAll().where('indicador_codigo', '=', indicador_codigo).where('ano', '=', ano).executeTakeFirst()

  if (existing) {
    await db.updateTable('metas').set({ meta_valor, limite_alerta, sentido, mes_inicio, mes_fim } as Record<string, unknown>).where('id', '=', existing.id).execute()
    await db.insertInto('audit_log').values({ id: uuid(), entidade: 'meta', entidade_id: existing.id, acao: 'editar', payload: JSON.stringify({ antes: existing, depois: { meta_valor, limite_alerta, sentido } }) }).execute()
  } else {
    const id = uuid()
    await (db.insertInto('metas').values({ id, indicador_codigo, ano, meta_valor, limite_alerta, sentido, mes_inicio, mes_fim } as any) as any).execute()
    await db.insertInto('audit_log').values({ id: uuid(), entidade: 'meta', entidade_id: id, acao: 'criar', valor_novo: indicador_codigo }).execute()
  }

  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).orderBy('indicador_codigo').execute()
  triggerToast(c, 'Meta salva!')
  return c.html(<MetasTable metas={metas} ano={ano} />)
})

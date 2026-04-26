import { Hono } from 'hono'
import { MainLayout } from '../views/layouts/MainLayout.js'
import { DashboardPage } from '../views/pages/DashboardPage.js'
import { DashboardContent } from '../views/partials/DashboardContent.js'
import { SemaforoGrid } from '../views/partials/SemaforoGrid.js'
import { getKysely } from '../config/database.js'
import { calcularStatus, INDICADORES_CONFIG, type IndicadorComMeta } from '../services/semaforo.service.js'

/** Maps indicador code → column in registros_mensais */
function getIndicadorCampo(codigo: string): string {
  const map: Record<string, string> = {
    '01': 'taxa_altas_pct', '02': 'intercorrencias_total', '03': 'taxa_internacao_pct',
    '04': 'obitos_total', '05': 'taxa_alteracao_pad_pct', '06': 'pacientes_total',
    '07': 'pacientes_infectados', '08': 'eventos_adversos_total', '09': 'ouv_reclamacoes',
  }
  return map[codigo] ?? codigo
}

export const dashboardViewRoutes = new Hono()

async function buildSemaforo(db: ReturnType<typeof getKysely>, ano: number, mes: number) {
  const registro = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()

  const metas = await db.selectFrom('metas').selectAll().where('ano', '=', ano).execute()

  const indicadores = Object.entries(INDICADORES_CONFIG).map(([codigo, config]) => {
    const meta = metas.find((m) => m.indicador_codigo === codigo)
    const valor = registro ? Number((registro as Record<string, unknown>)[getIndicadorCampo(codigo)] ?? 0) : 0
    const status = calcularStatus({ codigo, nome: config.nome, valor, meta: meta?.meta_valor ?? null, alerta: meta?.limite_alerta ?? null, sentido: meta?.sentido ?? config.sentido } as IndicadorComMeta)
    return { codigo, nome: config.nome, valor, meta: meta?.meta_valor ?? null, alerta: meta?.limite_alerta ?? null, sentido: (meta?.sentido ?? config.sentido) as string, status }
  })

  return { indicadores, registro }
}

// GET /dashboard — full page
dashboardViewRoutes.get('/', (c) => {
  return c.html(
    <MainLayout title="Dashboard" currentPath="/dashboard">
      <DashboardPage title="Dashboard" />
    </MainLayout>
  )
})

// GET /dashboard/content — HTMX partial
dashboardViewRoutes.get('/content', async (c) => {
  const db = getKysely()
  const today = new Date()
  const ano = Number(c.req.query('ano') || c.req.query('mes') ? c.req.query('ano') : today.getFullYear())
  const mes = Number(c.req.query('mes') || (today.getMonth() + 1))

  const { indicadores, registro } = await buildSemaforo(db, ano, mes)
  return c.html(<DashboardContent ano={ano} mes={mes} registro={registro} indicadores={indicadores} />)
})

// GET /dashboard/semaforo — HTMX partial (just the grid)
dashboardViewRoutes.get('/semaforo', async (c) => {
  const db = getKysely()
  const ano = Number(c.req.query('ano')) || new Date().getFullYear()
  const mes = Number(c.req.query('mes')) || (new Date().getMonth() + 1)
  const { indicadores } = await buildSemaforo(db, ano, mes)
  return c.html(<SemaforoGrid indicadores={indicadores} />)
})

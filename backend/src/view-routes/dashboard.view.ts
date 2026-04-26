import { Router } from 'express'
import { getKysely } from '../config/database.js'
import { INDICADORES_CONFIG, classificarTodos, type IndicadorComMeta } from '../services/semaforo.service.js'

export const dashboardViewRouter = Router()

function extractIndicadores(registro: Record<string, unknown>, metas: Array<{ indicador_codigo: string; meta_valor: number | null; limite_alerta: number | null; sentido: string }>): IndicadorComMeta[] {
  const fieldMap: Record<string, string> = {
    '01': 'taxa_altas_pct',
    '02': 'intercorrencias_total',
    '03': 'taxa_internacao_pct',
    '04': 'obitos_total',
    '05': 'taxa_alteracao_pad_pct',
    '06': 'pacientes_total',
    '07': 'pacientes_infectados',
    '08': 'eventos_adversos_total',
    '09': 'ouv_reclamacoes',
  }

  return Object.entries(fieldMap).map(([codigo, campo]) => {
    const config = INDICADORES_CONFIG[codigo]
    const meta = metas.find(m => m.indicador_codigo === codigo)
    return {
      codigo,
      nome: config?.nome ?? codigo,
      valor: (registro[campo] as number) ?? 0,
      meta: meta?.meta_valor ?? null,
      alerta: meta?.limite_alerta ?? null,
      sentido: (meta?.sentido ?? config?.sentido ?? 'neutro') as 'maior' | 'menor' | 'neutro',
    }
  })
}

// GET /dashboard — full page
dashboardViewRouter.get('/', async (_req, res) => {
  const db = getKysely()
  const now = new Date()
  const ano = Number(_req.query.ano) || now.getFullYear()
  const mes = Number(_req.query.mes) || now.getMonth() + 1

  const registro = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()

  const metas = await db.selectFrom('metas').selectAll()
    .where('ano', '=', ano).execute()

  const raw = registro ? extractIndicadores(registro as Record<string, unknown>, metas) : []
  const indicadores = classificarTodos(raw)

  res.render('dashboard', { title: 'Dashboard', currentPath: '/dashboard', ano, mes, indicadores })
})

// GET /dashboard/semaforo — partial (HTMX)
dashboardViewRouter.get('/semaforo', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.query.ano) || new Date().getFullYear()
  const mes = Number(req.query.mes) || new Date().getMonth() + 1

  const registro = await db.selectFrom('registros_mensais').selectAll()
    .where('ano', '=', ano).where('mes', '=', mes).executeTakeFirst()

  const metas = await db.selectFrom('metas').selectAll()
    .where('ano', '=', ano).execute()

  const raw = registro ? extractIndicadores(registro as Record<string, unknown>, metas) : []
  const indicadores = classificarTodos(raw)

  res.render('components/semaforo-grid', { layout: false, indicadores })
})

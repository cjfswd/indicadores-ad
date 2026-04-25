import { Router } from 'express'
import { getKysely } from '../config/database.js'
import { calcularStatus, INDICADORES_CONFIG, type IndicadorComMeta } from '../services/semaforo.service.js'

export const semaforoRouter = Router()

semaforoRouter.get('/:ano/:mes', async (req, res) => {
  const db = getKysely()
  const ano = Number(req.params.ano)
  const mes = Number(req.params.mes)

  const registro = await db
    .selectFrom('registros_mensais')
    .selectAll()
    .where('ano', '=', ano)
    .where('mes', '=', mes)
    .executeTakeFirst()

  const metasRows = await db
    .selectFrom('metas')
    .selectAll()
    .where('ano', '=', ano)
    .execute()

  const metasMap = new Map(metasRows.map(m => [m.indicador_codigo, m]))

  const mesAnterior = mes === 1 ? 12 : mes - 1
  const anoAnterior = mes === 1 ? ano - 1 : ano

  const regAnterior = await db
    .selectFrom('registros_mensais')
    .selectAll()
    .where('ano', '=', anoAnterior)
    .where('mes', '=', mesAnterior)
    .executeTakeFirst()

  const CAMPO_MAP: Record<string, string> = {
    '01': 'taxa_altas_pct', '02': 'intercorrencias_total', '03': 'taxa_internacao_pct',
    '04': 'obitos_total', '05': 'taxa_alteracao_pad_pct', '06': 'pacientes_total',
    '07': 'pacientes_infectados', '08': 'eventos_adversos_total', '09': 'ouv_reclamacoes',
  }

  const indicadores = Object.entries(INDICADORES_CONFIG).map(([codigo, config]) => {
    const campo = CAMPO_MAP[codigo]
    const valor = registro ? Number((registro as Record<string, unknown>)[campo] ?? 0) : 0
    const valorAnterior = regAnterior ? Number((regAnterior as Record<string, unknown>)[campo] ?? 0) : null
    const meta = metasMap.get(codigo)

    const ind: IndicadorComMeta = {
      codigo, nome: config.nome, valor,
      meta: meta?.meta_valor ?? null, alerta: meta?.limite_alerta ?? null,
      sentido: (meta?.sentido as 'maior' | 'menor' | 'neutro') ?? config.sentido,
    }

    return {
      ...ind,
      status: calcularStatus(ind),
      variacao: valorAnterior !== null ? Math.round((valor - valorAnterior) * 10) / 10 : null,
    }
  })

  res.json({ ano, mes, indicadores })
})

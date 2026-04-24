import { getKysely } from '../config/database.js'
import { INDICADORES_CONFIG, calcularStatus, type IndicadorComMeta } from './semaforo.service.js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubtipoData {
  nome: string
  valor: number
}

interface IndicadorRelatorio {
  codigo: string
  nome: string
  valor: number
  unidade: '%' | 'abs'
  status: string
  meta: number | null
  alerta: number | null
  variacao: number | null
  sentido: 'maior' | 'menor' | 'neutro'
  subtipos: SubtipoData[]
}

export interface RelatorioData {
  ano: number
  mes: number
  periodo: string
  pacientesTotal: number
  pacientesAD: number
  pacientesID: number
  eventosAdversos: number
  taxaAltas: number
  indicadores: IndicadorRelatorio[]
}

// ─── Sub-indicator mappings ───────────────────────────────────────────────────

const CAMPO_MAP: Record<string, string> = {
  '01': 'taxa_altas_pct', '02': 'intercorrencias_total', '03': 'taxa_internacao_pct',
  '04': 'obitos_total', '05': 'taxa_alteracao_pad_pct', '06': 'pacientes_total',
  '07': 'pacientes_infectados', '08': 'eventos_adversos_total', '09': 'ouvidorias_total',
}

const UNIDADE_MAP: Record<string, '%' | 'abs'> = {
  '01': '%', '02': 'abs', '03': '%', '04': 'abs', '05': '%',
  '06': 'abs', '07': 'abs', '08': 'abs', '09': 'abs',
}

interface SubtipoConfig {
  nome: string
  campo: string
}

const SUBTIPOS_MAP: Record<string, SubtipoConfig[]> = {
  '02': [
    { nome: 'Removidas em Domicílio', campo: 'intercorr_removidas_dom' },
    { nome: 'Necessidade de Remoção', campo: 'intercorr_necessidade_rem' },
  ],
  '03': [
    { nome: 'Deterioração Clínica', campo: 'intern_deterioracao' },
    { nome: 'Não Aderência ao Tratamento', campo: 'intern_nao_aderencia' },
  ],
  '04': [
    { nome: '< 48h após Implantação', campo: 'obitos_menos_48h' },
    { nome: '> 48h após Implantação', campo: 'obitos_mais_48h' },
  ],
  '06': [
    { nome: 'Pacientes AD', campo: 'pacientes_ad' },
    { nome: 'Pacientes ID', campo: 'pacientes_id' },
  ],
  '07': [
    { nome: 'ATB iniciado em 48h', campo: 'infeccao_atb_48h' },
  ],
  '08': [
    { nome: 'Quedas', campo: 'ea_quedas' },
    { nome: 'Broncoaspiração', campo: 'ea_broncoaspiracao' },
    { nome: 'Lesão por Pressão', campo: 'ea_lesao_pressao' },
    { nome: 'Decanulação', campo: 'ea_decanulacao' },
    { nome: 'Saída Acidental da GTT', campo: 'ea_saida_gtt' },
  ],
  '09': [
    { nome: 'Elogios', campo: 'ouv_elogios' },
    { nome: 'Sugestões', campo: 'ouv_sugestoes' },
    { nome: 'Reclamações e Solicitações', campo: 'ouv_reclamacoes' },
  ],
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ─── Service ──────────────────────────────────────────────────────────────────

export async function buildRelatorioData(ano: number, mes: number): Promise<RelatorioData> {
  const db = getKysely()

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

  // Registro anterior para variação
  const mesAnt = mes === 1 ? 12 : mes - 1
  const anoAnt = mes === 1 ? ano - 1 : ano
  const regAnterior = await db
    .selectFrom('registros_mensais')
    .selectAll()
    .where('ano', '=', anoAnt)
    .where('mes', '=', mesAnt)
    .executeTakeFirst()

  const reg = (registro ?? {}) as Record<string, unknown>
  const regAnt = (regAnterior ?? null) as Record<string, unknown> | null

  const indicadores: IndicadorRelatorio[] = Object.entries(INDICADORES_CONFIG).map(([codigo, config]) => {
    const campo = CAMPO_MAP[codigo]
    const valor = Number(reg[campo] ?? 0)
    const valorAnterior = regAnt ? Number(regAnt[campo] ?? 0) : null
    const metaRow = metasMap.get(codigo)

    const ind: IndicadorComMeta = {
      codigo,
      nome: config.nome,
      valor,
      meta: metaRow?.meta_valor ?? null,
      alerta: metaRow?.limite_alerta ?? null,
      sentido: (metaRow?.sentido as 'maior' | 'menor' | 'neutro') ?? config.sentido,
    }

    const subtiposConfig = SUBTIPOS_MAP[codigo] ?? []
    const subtipos: SubtipoData[] = subtiposConfig.map(s => ({
      nome: s.nome,
      valor: Number(reg[s.campo] ?? 0),
    }))

    return {
      codigo,
      nome: config.nome,
      valor,
      unidade: UNIDADE_MAP[codigo],
      status: calcularStatus(ind),
      meta: ind.meta,
      alerta: ind.alerta,
      variacao: valorAnterior !== null ? Math.round((valor - valorAnterior) * 10) / 10 : null,
      sentido: ind.sentido,
      subtipos,
    }
  })

  return {
    ano,
    mes,
    periodo: `${MESES[mes - 1]} ${ano}`,
    pacientesTotal: Number(reg.pacientes_total ?? 0),
    pacientesAD: Number(reg.pacientes_ad ?? 0),
    pacientesID: Number(reg.pacientes_id ?? 0),
    eventosAdversos: Number(reg.eventos_adversos_total ?? 0),
    taxaAltas: Number(reg.taxa_altas_pct ?? 0),
    indicadores,
  }
}

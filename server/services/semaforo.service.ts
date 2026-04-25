type Status = 'verde' | 'amarelo' | 'vermelho' | 'neutro'
type Sentido = 'maior' | 'menor' | 'neutro'

export interface IndicadorComMeta {
  codigo: string
  nome: string
  valor: number
  meta: number | null
  alerta: number | null
  sentido: Sentido
}

export interface IndicadorClassificado extends IndicadorComMeta {
  status: Status
}

const INDICADORES_CONFIG: Record<string, { nome: string; sentido: Sentido }> = {
  '01': { nome: 'Taxa de Altas Domiciliares', sentido: 'maior' },
  '02': { nome: 'Intercorrências', sentido: 'menor' },
  '03': { nome: 'Taxa de Internação Hospitalar', sentido: 'menor' },
  '04': { nome: 'Óbitos', sentido: 'menor' },
  '05': { nome: 'Taxa de Alteração de PAD', sentido: 'neutro' },
  '06': { nome: 'Quantitativo de Pacientes AD/ID', sentido: 'neutro' },
  '07': { nome: 'Pacientes Infectados', sentido: 'menor' },
  '08': { nome: 'Eventos Adversos', sentido: 'menor' },
  '09': { nome: 'Ouvidorias (Reclamações)', sentido: 'menor' },
}

export function calcularStatus(ind: IndicadorComMeta): Status {
  if (ind.sentido === 'neutro' || ind.meta === null) return 'neutro'

  if (ind.sentido === 'maior') {
    if (ind.valor >= ind.meta) return 'verde'
    if (ind.alerta !== null && ind.valor >= ind.alerta) return 'amarelo'
    return 'vermelho'
  }

  // sentido === 'menor'
  if (ind.valor <= ind.meta) return 'verde'
  if (ind.alerta !== null && ind.valor <= ind.alerta) return 'amarelo'
  return 'vermelho'
}

export function classificarTodos(indicadores: IndicadorComMeta[]): IndicadorClassificado[] {
  return indicadores.map(ind => ({
    ...ind,
    status: calcularStatus(ind),
  }))
}

export function getIndicadorConfig(codigo: string) {
  return INDICADORES_CONFIG[codigo] ?? null
}

export { INDICADORES_CONFIG }

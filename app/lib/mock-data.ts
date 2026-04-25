interface RegistroMensal {
  ano: number; mes: number
  taxa_altas_pct: number; intercorrencias_total: number
  intercorr_removidas_dom: number; intercorr_necessidade_rem: number
  taxa_internacao_pct: number; intern_deterioracao: number; intern_nao_aderencia: number
  obitos_total: number; obitos_menos_48h: number; obitos_mais_48h: number
  taxa_alteracao_pad_pct: number
  pacientes_total: number; pacientes_ad: number; pacientes_id: number
  pacientes_infectados: number
  eventos_adversos_total: number; ea_quedas: number; ea_broncoaspiracao: number
  ea_lesao_pressao: number; ea_decanulacao: number; ea_saida_gtt: number
  ouvidorias_total: number; ouv_elogios: number; ouv_sugestoes: number; ouv_reclamacoes: number
}

type Status = 'verde' | 'amarelo' | 'vermelho' | 'neutro'

export interface SemaforoItem {
  codigo: string
  nome: string
  valor: number
  unidade: '%' | 'abs'
  status: Status
  meta: number | null
  alerta: number | null
  variacao: number | null
  subtipos: { nome: string; valor: number }[]
}

export interface DashboardData {
  registro: RegistroMensal
  semaforos: SemaforoItem[]
  historico: { mes: string; valor: number }[]
}

/** Mock data enquanto o backend não está integrado */
export function getMockDashboard(ano: number, mes: number): DashboardData {
  const registro: RegistroMensal = {
    ano,
    mes,
    taxa_altas_pct: 20.0,
    intercorrencias_total: 8,
    intercorr_removidas_dom: 5,
    intercorr_necessidade_rem: 3,
    taxa_internacao_pct: 4.4,
    intern_deterioracao: 3,
    intern_nao_aderencia: 1,
    obitos_total: 2,
    obitos_menos_48h: 0,
    obitos_mais_48h: 2,
    taxa_alteracao_pad_pct: 3.3,
    pacientes_total: 90,
    pacientes_ad: 72,
    pacientes_id: 18,
    pacientes_infectados: 5,
    eventos_adversos_total: 4,
    ea_quedas: 2,
    ea_broncoaspiracao: 0,
    ea_lesao_pressao: 1,
    ea_decanulacao: 0,
    ea_saida_gtt: 1,
    ouvidorias_total: 12,
    ouv_elogios: 7,
    ouv_sugestoes: 3,
    ouv_reclamacoes: 2,
  }

  const semaforos: SemaforoItem[] = [
    {
      codigo: '01', nome: 'Taxa de Altas Domiciliares (%)', valor: 20.0, unidade: '%', status: 'verde',
      meta: 20, alerta: 15, variacao: 2.1,
      subtipos: [],
    },
    {
      codigo: '02', nome: 'Nº de Intercorrências', valor: 8, unidade: 'abs', status: 'vermelho',
      meta: 3, alerta: 6, variacao: 3,
      subtipos: [
        { nome: 'Removidas em Domicílio', valor: 5 },
        { nome: 'Necessidade de Remoção', valor: 3 },
      ],
    },
    {
      codigo: '03', nome: 'Taxa de Internação Hospitalar (%)', valor: 4.4, unidade: '%', status: 'verde',
      meta: 5, alerta: 10, variacao: -0.6,
      subtipos: [
        { nome: 'Deterioração Clínica', valor: 3 },
        { nome: 'Não Aderência ao Tratamento', valor: 1 },
      ],
    },
    {
      codigo: '04', nome: 'Nº de Óbitos', valor: 2, unidade: 'abs', status: 'amarelo',
      meta: 1, alerta: 3, variacao: -1,
      subtipos: [
        { nome: '< 48h após Implantação', valor: 0 },
        { nome: '> 48h após Implantação', valor: 2 },
      ],
    },
    {
      codigo: '05', nome: 'Taxa de Alteração de PAD (%)', valor: 3.3, unidade: '%', status: 'neutro',
      meta: null, alerta: null, variacao: 0.5,
      subtipos: [],
    },
    {
      codigo: '06', nome: 'Total de Pacientes (AD + ID)', valor: 90, unidade: 'abs', status: 'neutro',
      meta: null, alerta: null, variacao: 2,
      subtipos: [
        { nome: 'Pacientes AD', valor: 72 },
        { nome: 'Pacientes ID', valor: 18 },
      ],
    },
    {
      codigo: '07', nome: 'Nº de Pacientes Infectados', valor: 5, unidade: 'abs', status: 'amarelo',
      meta: 2, alerta: 5, variacao: 1,
      subtipos: [],
    },
    {
      codigo: '08', nome: 'Nº de Eventos Adversos', valor: 4, unidade: 'abs', status: 'vermelho',
      meta: 0, alerta: 2, variacao: 2,
      subtipos: [
        { nome: 'Quedas', valor: 2 },
        { nome: 'Broncoaspiração', valor: 0 },
        { nome: 'Lesão por Pressão', valor: 1 },
        { nome: 'Decanulação', valor: 0 },
        { nome: 'Saída Acidental da GTT', valor: 1 },
      ],
    },
    {
      codigo: '09', nome: 'Nº de Ouvidorias', valor: 2, unidade: 'abs', status: 'amarelo',
      meta: 0, alerta: 2, variacao: 0,
      subtipos: [
        { nome: 'Elogios', valor: 7 },
        { nome: 'Sugestões', valor: 3 },
        { nome: 'Reclamações e Solicitações', valor: 2 },
      ],
    },
  ]

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const historico = meses.slice(0, mes).map((m, i) => ({
    mes: m,
    valor: 15 + Math.round(Math.random() * 10 * 10) / 10,
  }))
  if (historico.length > 0) {
    historico[historico.length - 1].valor = 20.0
  }

  return { registro, semaforos, historico }
}

import { useState, useEffect, useMemo } from 'react'
import { Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { ResumoCard } from '@/components/dashboard/ResumoCard'
import { SemaforoCard } from '@/components/dashboard/SemaforoCard'
import { GraficoBarrasSimples } from '@/components/dashboard/GraficoBarras'
import { GraficoPizza } from '@/components/dashboard/GraficoPizza'
import { DashboardExportBar } from '@/components/dashboard/DashboardExportBar'
import { PageHeader } from '@/components/PageHeader'
import { apiClient, type SemaforoIndicador } from '@/lib/api-client'
import { getMockDashboard } from '@/lib/mock-data'
import { CHART_COLORS, type SemaforoItem } from '@/lib/chart-helpers'

export function DashboardPage() {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [semaforos, setSemaforos] = useState<SemaforoItem[]>([])
  const [registro, setRegistro] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [useDateRange, setUseDateRange] = useState(false)
  const [rangeInicio, setRangeInicio] = useState(`${ano}-01`)
  const [rangeFim, setRangeFim] = useState(`${ano}-${String(mes).padStart(2, '0')}`)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [semaforoData, registroData] = await Promise.all([
          apiClient.semaforo.buscar(ano, mes),
          apiClient.registros.buscarMes(ano, mes).catch(() => null),
        ])
        const apiSemaforos: SemaforoItem[] = semaforoData.indicadores.map((s: SemaforoIndicador) => ({
          ...s,
          unidade: s.codigo === '01' || s.codigo === '03' || s.codigo === '05' ? '%' as const : 'abs' as const,
          subtipos: [],
        }))
        setSemaforos(apiSemaforos)
        setRegistro(registroData as unknown as Record<string, unknown> ?? null)
      } catch {
        const mock = getMockDashboard(ano, mes)
        setSemaforos(mock.semaforos)
        setRegistro(mock.registro as unknown as Record<string, unknown>)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ano, mes])

  const pacientesTotal = Number(registro?.pacientes_total ?? 0)
  const pacientesAD = Number(registro?.pacientes_ad ?? 0)
  const pacientesID = Number(registro?.pacientes_id ?? 0)
  const eventosAdversos = Number(registro?.eventos_adversos_total ?? 0)
  const taxaAltas = Number(registro?.taxa_altas_pct ?? 0)

  const sparkPacientes = [75, 78, 82, 85, 88, pacientesTotal]
  const sparkEA = [2, 3, 1, 5, 3, eventosAdversos]
  const sparkAltas = [15, 18, 16, 19, 17, taxaAltas]

  const dadosEventosTipo = useMemo(() => {
    const ea = semaforos.find(s => s.codigo === '08')
    if (!ea?.subtipos.length) {
      return [
        { nome: 'Quedas', valor: Number(registro?.ea_quedas ?? 0), cor: CHART_COLORS.warning },
        { nome: 'Broncoasp.', valor: Number(registro?.ea_broncoaspiracao ?? 0), cor: CHART_COLORS.danger },
        { nome: 'Lesão Press.', valor: Number(registro?.ea_lesao_pressao ?? 0), cor: CHART_COLORS.secondary },
        { nome: 'Decanulação', valor: Number(registro?.ea_decanulacao ?? 0), cor: CHART_COLORS.accent },
        { nome: 'Saída GTT', valor: Number(registro?.ea_saida_gtt ?? 0), cor: CHART_COLORS.primary },
      ]
    }
    return ea.subtipos.map((s, i) => ({
      nome: s.nome, valor: s.valor,
      cor: [CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.primary][i % 5],
    }))
  }, [semaforos, registro])

  const dadosModalidade = useMemo(() => [
    { nome: 'AD — Atenção Domiciliar', valor: pacientesAD, cor: CHART_COLORS.primary },
    { nome: 'ID — Internação Domiciliar', valor: pacientesID, cor: CHART_COLORS.accent },
  ], [pacientesAD, pacientesID])

  const dadosOuvidorias = useMemo(() => [
    { nome: 'Elogios', valor: Number(registro?.ouv_elogios ?? 0), cor: CHART_COLORS.success },
    { nome: 'Sugestões', valor: Number(registro?.ouv_sugestoes ?? 0), cor: CHART_COLORS.warning },
    { nome: 'Reclamações', valor: Number(registro?.ouv_reclamacoes ?? 0), cor: CHART_COLORS.danger },
  ], [registro])

  const dadosObitos = useMemo(() => [
    { nome: '< 48h após Implantação', valor: Number(registro?.obitos_menos_48h ?? 0), cor: CHART_COLORS.warning },
    { nome: '> 48h após Implantação', valor: Number(registro?.obitos_mais_48h ?? 0), cor: CHART_COLORS.danger },
  ], [registro])

  const dadosInternacao = useMemo(() => [
    { nome: 'Deterioração Clínica', valor: Number(registro?.intern_deterioracao ?? 0), cor: CHART_COLORS.danger },
    { nome: 'Não Aderência ao Tratamento', valor: Number(registro?.intern_nao_aderencia ?? 0), cor: CHART_COLORS.warning },
  ], [registro])

  const dadosIntercorrencias = useMemo(() => [
    { nome: 'Resolvidas em Domicílio', valor: Number(registro?.intercorr_removidas_dom ?? 0), cor: CHART_COLORS.success },
    { nome: 'Necessidade de Remoção', valor: Number(registro?.intercorr_necessidade_rem ?? 0), cor: CHART_COLORS.danger },
  ], [registro])

  const totalInfectados = Number(registro?.pacientes_infectados ?? 0)
  const atb48h = Number(registro?.infeccao_atb_48h ?? 0)
  const dadosInfeccoes = useMemo(() => [
    { nome: 'ATB iniciado em 48h', valor: atb48h, cor: CHART_COLORS.success },
    { nome: 'Sem ATB em 48h', valor: Math.max(totalInfectados - atb48h, 0), cor: CHART_COLORS.danger },
  ], [totalInfectados, atb48h])

  return (
    <div className="space-y-4 sm:space-y-8">
      <PageHeader
        icon={<TrendingUp size={20} />}
        iconClassName="bg-blue-500/15 text-blue-400"
        title="Dashboard"
        subtitle="Visão consolidada dos indicadores assistenciais"
      />

      <DashboardExportBar
        ano={ano} mes={mes} onPeriodoChange={(a, m) => { setAno(a); setMes(m) }}
        useDateRange={useDateRange} rangeInicio={rangeInicio} rangeFim={rangeFim}
        onUseDateRangeChange={setUseDateRange} onRangeInicioChange={setRangeInicio} onRangeFimChange={setRangeFim}
        loading={loading} exporting={exporting}
      />

      {/* Resumo Cards */}
      <div id="resumo-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResumoCard icon={<Users size={20} />} label="Pacientes Ativos" valor={pacientesTotal}
          descricao={`${pacientesAD} em Atenção Domiciliar (AD) e ${pacientesID} em Internação Domiciliar (ID)`}
          variacao={2} colorClass="bg-blue-500/15 text-blue-400" sparkline={sparkPacientes} sparkColor="#3b82f6" />
        <ResumoCard icon={<AlertTriangle size={20} />} label="Eventos Adversos" valor={eventosAdversos}
          descricao="Inclui quedas, broncoaspiração, lesão por pressão, decanulação e saída de GTT"
          variacao={2} colorClass="bg-red-500/15 text-red-400" sparkline={sparkEA} sparkColor="#ef4444" />
        <ResumoCard icon={<TrendingUp size={20} />} label="Taxa de Altas" valor={`${taxaAltas}%`}
          descricao="Percentual de pacientes que receberam alta domiciliar no período"
          variacao={2.1} colorClass="bg-emerald-500/15 text-emerald-400" sparkline={sparkAltas} sparkColor="#10b981" />
      </div>

      {/* Semáforo Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 sm:mb-4">
          Indicadores — Semáforos
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-card p-4 h-32 animate-pulse bg-[var(--overlay-soft)]" />
            ))}
          </div>
        ) : (
          <div id="semaforo-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {semaforos.map((item, i) => <SemaforoCard key={item.codigo} item={item} index={i} />)}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <GraficoBarrasSimples dados={dadosEventosTipo} titulo="Eventos Adversos por Tipo" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <div id="grafico-pizza"><GraficoPizza dados={dadosModalidade} titulo="Pacientes por Modalidade" /></div>
        <div id="grafico-pizza-ouvidorias"><GraficoPizza dados={dadosOuvidorias} titulo="Ouvidorias por Tipo" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <div id="grafico-obitos"><GraficoPizza dados={dadosObitos} titulo="Óbitos por Período" /></div>
        <div id="grafico-internacao"><GraficoPizza dados={dadosInternacao} titulo="Internação Hospitalar" /></div>
        <div id="grafico-intercorrencias"><GraficoPizza dados={dadosIntercorrencias} titulo="Intercorrências" /></div>
        <div id="grafico-infeccoes"><GraficoPizza dados={dadosInfeccoes} titulo="Pacientes Infectados — ATB em 48h" /></div>
      </div>
    </div>
  )
}

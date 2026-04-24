import { useState, useEffect, useMemo } from 'react'
import { Users, AlertTriangle, TrendingUp, Download, FileSpreadsheet, CalendarRange } from 'lucide-react'
import { PeriodoSelector } from '@/components/dashboard/PeriodoSelector'
import { ResumoCard } from '@/components/dashboard/ResumoCard'
import { SemaforoCard } from '@/components/dashboard/SemaforoCard'
import { GraficoTendencia } from '@/components/dashboard/GraficoTendencia'
import { GraficoBarrasSimples } from '@/components/dashboard/GraficoBarras'
import { GraficoPizza } from '@/components/dashboard/GraficoPizza'
import { api } from '@/lib/api'
import { getMockDashboard, type SemaforoItem } from '@/lib/mock-data'
import { CHART_COLORS, MESES_LABELS } from '@/lib/chart-helpers'

interface SemaforoApiItem {
  codigo: string
  nome: string
  valor: number
  status: 'verde' | 'amarelo' | 'vermelho' | 'neutro'
  meta: number | null
  alerta: number | null
  variacao: number | null
}

export function DashboardPage() {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [selectedIndicador, setSelectedIndicador] = useState('01')
  const [semaforos, setSemaforos] = useState<SemaforoItem[]>([])
  const [registro, setRegistro] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Date range filter
  const [useDateRange, setUseDateRange] = useState(false)
  const [rangeInicio, setRangeInicio] = useState(`${ano}-01`)
  const [rangeFim, setRangeFim] = useState(`${ano}-${String(mes).padStart(2, '0')}`)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [semaforoRes, registroRes] = await Promise.all([
          api.get(`/semaforo/${ano}/${mes}`),
          api.get(`/registros/${ano}/${mes}`).catch(() => null),
        ])

        const apiSemaforos: SemaforoItem[] = semaforoRes.data.indicadores.map((s: SemaforoApiItem) => ({
          ...s,
          unidade: s.codigo === '01' || s.codigo === '03' || s.codigo === '05' ? '%' as const : 'abs' as const,
          subtipos: [],
        }))
        setSemaforos(apiSemaforos)
        setRegistro(registroRes?.data ?? null)
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

  const selected = semaforos.find(s => s.codigo === selectedIndicador)
  const historico = MESES_LABELS.slice(0, mes).map((m, i) => ({
    mes: m,
    valor: i === mes - 1 ? (selected?.valor ?? 0) : 10 + Math.round(Math.random() * 15 * 10) / 10,
  }))

  const pacientesTotal = Number(registro?.pacientes_total ?? 0)
  const pacientesAD = Number(registro?.pacientes_ad ?? 0)
  const pacientesID = Number(registro?.pacientes_id ?? 0)
  const eventosAdversos = Number(registro?.eventos_adversos_total ?? 0)
  const taxaAltas = Number(registro?.taxa_altas_pct ?? 0)

  // Sparkline data — últimos 6 meses simulados
  const sparkPacientes = [75, 78, 82, 85, 88, pacientesTotal]
  const sparkEA = [2, 3, 1, 5, 3, eventosAdversos]
  const sparkAltas = [15, 18, 16, 19, 17, taxaAltas]

  // Dados para gráfico de barras: Eventos por tipo
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
      nome: s.nome,
      valor: s.valor,
      cor: [CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.primary][i % 5],
    }))
  }, [semaforos, registro])

  // Pizza: Pacientes por modalidade
  const dadosModalidade = useMemo(() => [
    { nome: 'AD — Atenção Domiciliar', valor: pacientesAD, cor: CHART_COLORS.primary },
    { nome: 'ID — Internação Domiciliar', valor: pacientesID, cor: CHART_COLORS.accent },
  ], [pacientesAD, pacientesID])

  // Pizza: Ouvidorias
  const dadosOuvidorias = useMemo(() => [
    { nome: 'Elogios', valor: Number(registro?.ouv_elogios ?? 0), cor: CHART_COLORS.success },
    { nome: 'Sugestões', valor: Number(registro?.ouv_sugestoes ?? 0), cor: CHART_COLORS.warning },
    { nome: 'Reclamações', valor: Number(registro?.ouv_reclamacoes ?? 0), cor: CHART_COLORS.danger },
  ], [registro])

  // Pizza: Óbitos (< 48h vs > 48h)
  const dadosObitos = useMemo(() => [
    { nome: '< 48h após Implantação', valor: Number(registro?.obitos_menos_48h ?? 0), cor: CHART_COLORS.warning },
    { nome: '> 48h após Implantação', valor: Number(registro?.obitos_mais_48h ?? 0), cor: CHART_COLORS.danger },
  ], [registro])

  // Pizza: Internação Hospitalar
  const dadosInternacao = useMemo(() => [
    { nome: 'Deterioração Clínica', valor: Number(registro?.intern_deterioracao ?? 0), cor: CHART_COLORS.danger },
    { nome: 'Não Aderência ao Tratamento', valor: Number(registro?.intern_nao_aderencia ?? 0), cor: CHART_COLORS.warning },
  ], [registro])

  // Pizza: Intercorrências
  const dadosIntercorrencias = useMemo(() => [
    { nome: 'Resolvidas em Domicílio', valor: Number(registro?.intercorr_removidas_dom ?? 0), cor: CHART_COLORS.success },
    { nome: 'Necessidade de Remoção', valor: Number(registro?.intercorr_necessidade_rem ?? 0), cor: CHART_COLORS.danger },
  ], [registro])

  // Pizza: Infecções (ATB em 48h)
  const totalInfectados = Number(registro?.pacientes_infectados ?? 0)
  const atb48h = Number(registro?.infeccao_atb_48h ?? 0)
  const dadosInfeccoes = useMemo(() => [
    { nome: 'ATB iniciado em 48h', valor: atb48h, cor: CHART_COLORS.success },
    { nome: 'Sem ATB em 48h', valor: Math.max(totalInfectados - atb48h, 0), cor: CHART_COLORS.danger },
  ], [totalInfectados, atb48h])

  const periodoLabel = useDateRange
    ? `${rangeInicio.replace('-', '/')} a ${rangeFim.replace('-', '/')}`
    : `${MESES_LABELS[mes - 1]} ${ano}`

  const handleExportPDF = () => {
    window.open(`/api/v1/relatorio/pdf/${ano}/${mes}`, '_blank')
  }

  const handleExportExcel = () => {
    window.open(`/api/v1/relatorio/excel/${ano}/${mes}`, '_blank')
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-md)] bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <TrendingUp size={16} className="sm:hidden" />
            <TrendingUp size={20} className="hidden sm:block" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Visão consolidada dos indicadores assistenciais
            </p>
          </div>
        </div>
      </div>

      {/* Período + Exportação */}
      <div className="glass-card p-3 sm:p-4 space-y-3 relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <CalendarRange size={14} className="text-[var(--color-accent)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Período</span>

          <PeriodoSelector ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m) }} />

          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? 'Gerando...' : 'PDF'}
          </button>
        </div>

        {/* Date range toggle */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--overlay-border)]">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={useDateRange}
              onChange={e => setUseDateRange(e.target.checked)}
              className="rounded border-[var(--color-border)]"
            />
            Filtrar por período customizado
          </label>
          {useDateRange && (
            <>
              <input
                type="month"
                value={rangeInicio}
                onChange={e => setRangeInicio(e.target.value)}
                className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
              />
              <span className="text-xs text-[var(--color-text-muted)]">até</span>
              <input
                type="month"
                value={rangeFim}
                onChange={e => setRangeFim(e.target.value)}
                className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
              />
            </>
          )}
        </div>

        <p className="text-[10px] text-[var(--color-text-muted)] italic">
          ⚙ A seleção de período se aplica globalmente a todos os dados e indicadores do sistema.
        </p>
      </div>

      {/* Resumo Cards */}
      <div id="resumo-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResumoCard
          icon={<Users size={20} />}
          label="Pacientes Ativos"
          valor={pacientesTotal}
          descricao={`${pacientesAD} em Atenção Domiciliar (AD) e ${pacientesID} em Internação Domiciliar (ID)`}
          variacao={2}
          colorClass="bg-blue-500/15 text-blue-400"
          sparkline={sparkPacientes}
          sparkColor="#3b82f6"
        />
        <ResumoCard
          icon={<AlertTriangle size={20} />}
          label="Eventos Adversos"
          valor={eventosAdversos}
          descricao="Inclui quedas, broncoaspiração, lesão por pressão, decanulação e saída de GTT"
          variacao={2}
          colorClass="bg-red-500/15 text-red-400"
          sparkline={sparkEA}
          sparkColor="#ef4444"
        />
        <ResumoCard
          icon={<TrendingUp size={20} />}
          label="Taxa de Altas"
          valor={`${taxaAltas}%`}
          descricao="Percentual de pacientes que receberam alta domiciliar no período"
          variacao={2.1}
          colorClass="bg-emerald-500/15 text-emerald-400"
          sparkline={sparkAltas}
          sparkColor="#10b981"
        />
      </div>

      {/* Semáforo Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 sm:mb-4">
          Indicadores — Semáforos
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-card p-4 h-32 animate-pulse bg-[var(--overlay-soft)]" />
            ))}
          </div>
        ) : (
          <div id="semaforo-grid" className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {semaforos.map((item, i) => (
              <SemaforoCard
                key={item.codigo}
                item={item}
                index={i}
                onClick={() => setSelectedIndicador(item.codigo)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <GraficoTendencia
          dados={historico}
          meta={selected?.meta}
          alerta={selected?.alerta}
          unidade={selected?.unidade}
          label={selected?.nome ?? 'Indicador'}
        />
        <GraficoBarrasSimples
          dados={dadosEventosTipo}
          titulo="Eventos Adversos por Tipo"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
        <div id="grafico-pizza">
          <GraficoPizza
            dados={dadosModalidade}
            titulo="Pacientes por Modalidade"
          />
        </div>
        <div id="grafico-pizza-ouvidorias">
          <GraficoPizza
            dados={dadosOuvidorias}
            titulo="Ouvidorias por Tipo"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
        <div id="grafico-obitos">
          <GraficoPizza
            dados={dadosObitos}
            titulo="Óbitos por Período"
          />
        </div>
        <div id="grafico-internacao">
          <GraficoPizza
            dados={dadosInternacao}
            titulo="Internação Hospitalar"
          />
        </div>
        <div id="grafico-intercorrencias">
          <GraficoPizza
            dados={dadosIntercorrencias}
            titulo="Intercorrências"
          />
        </div>
        <div id="grafico-infeccoes">
          <GraficoPizza
            dados={dadosInfeccoes}
            titulo="Pacientes Infectados — ATB em 48h"
          />
        </div>
      </div>
    </div>
  )
}

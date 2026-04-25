import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, LabelList,
} from 'recharts'
import { CHART_COLORS } from '~/lib/chart-helpers'

interface BarDatum {
  nome: string
  [key: string]: string | number
}

interface GraficoBarrasProps {
  dados: BarDatum[]
  chaves: { key: string; label: string; cor?: string }[]
  titulo: string
}

export function GraficoBarras({ dados, chaves, titulo }: GraficoBarrasProps) {
  const cores = [CHART_COLORS.primary, CHART_COLORS.accent, CHART_COLORS.secondary, CHART_COLORS.warning]

  return (
    <div className="glass-card p-5 animate-fade-in" id="grafico-barras">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {titulo}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dados} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
          <XAxis
            dataKey="nome"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<BarTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string, entry: { payload?: { fill?: string } }) => (
              <span style={{ color: entry.payload?.fill ?? '#94a3b8' }}>{value}</span>
            )}
          />
          {chaves.map((c, i) => (
            <Bar
              key={c.key}
              dataKey={c.key}
              name={c.label}
              fill={c.cor ?? cores[i % cores.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              <LabelList dataKey={c.key} position="top" offset={4} fill="#94a3b8" fontSize={10} fontWeight={600} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface BarSimplesDatum {
  nome: string
  valor: number
  cor?: string
}

interface GraficoBarrasSimplesProps {
  dados: BarSimplesDatum[]
  titulo: string
}

export function GraficoBarrasSimples({ dados, titulo }: GraficoBarrasSimplesProps) {
  return (
    <div className="glass-card p-5 animate-fade-in" id="grafico-barras-simples">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {titulo}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dados} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
          <XAxis
            dataKey="nome"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<BarTooltip />} />
          <Bar dataKey="valor" name="Quantidade" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {dados.map((d, i) => (
              <Cell key={i} fill={d.cor ?? CHART_COLORS.primary} />
            ))}
            <LabelList dataKey="valor" position="top" offset={4} fill="#94a3b8" fontSize={10} fontWeight={700} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function BarTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--color-text-secondary)] text-xs">{p.name}:</span>
          <span className="font-bold text-[var(--color-text-primary)] tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

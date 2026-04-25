import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CHART_COLORS } from '~/lib/chart-helpers'

interface PieDatum {
  nome: string
  valor: number
  cor?: string
}

interface GraficoPizzaProps {
  dados: PieDatum[]
  titulo: string
  id?: string
}

const PIE_COLORS = [
  CHART_COLORS.primary, CHART_COLORS.accent, CHART_COLORS.secondary,
  CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger,
  '#ec4899', '#8b5cf6', '#14b8a6',
]

const RADIAN = Math.PI / 180

function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent, value,
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number
  percent: number; value: number
}) {
  if (percent < 0.05) return null // Esconder labels < 5%
  const radius = innerRadius + (outerRadius - innerRadius) * 1.3
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x} y={y}
      fill="#94a3b8"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {value} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

export function GraficoPizza({ dados, titulo, id }: GraficoPizzaProps) {
  const total = dados.reduce((s, d) => s + d.valor, 0)
  if (total === 0) return null

  return (
    <div className="glass-card p-5 animate-fade-in" id={id ?? 'grafico-pizza'}>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {titulo}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dados}
            dataKey="valor"
            nameKey="nome"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
            label={renderCustomLabel}
            labelLine={false}
          >
            {dados.map((d, i) => (
              <Cell key={i} fill={d.cor ?? PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip total={total} />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string, entry: { payload?: { valor?: number; cor?: string }; color?: string }) => {
              const val = entry.payload?.valor ?? 0
              const pct = total > 0 ? ((val / total) * 100).toFixed(0) : '0'
              return (
                <span style={{ color: entry.color ?? '#94a3b8' }}>
                  {value}: <strong>{val}</strong> <span style={{ opacity: 0.7 }}>({pct}%)</span>
                </span>
              )
            }}
          />
          {/* Center label */}
          <text x="50%" y="42%" textAnchor="middle" className="fill-[var(--color-text-primary)]" style={{ fontSize: 22, fontWeight: 700 }}>
            {total}
          </text>
          <text x="50%" y="51%" textAnchor="middle" className="fill-[var(--color-text-muted)]" style={{ fontSize: 10 }}>
            total
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieTooltip({ active, payload, total }: {
  active?: boolean
  payload?: { name: string; value: number; payload: { cor?: string } }[]
  total: number
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0'

  return (
    <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--color-text-muted)]">{p.name}</p>
      <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
        {p.value} <span className="text-xs font-normal text-[var(--color-text-muted)]">({pct}%)</span>
      </p>
    </div>
  )
}

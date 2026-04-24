import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, LabelList,
} from 'recharts'
import { CHART_COLORS } from '@/lib/chart-helpers'

interface GraficoTendenciaProps {
  dados: { mes: string; valor: number }[]
  meta?: number | null
  alerta?: number | null
  unidade?: '%' | 'abs'
  label?: string
}

export function GraficoTendencia({ dados, meta, alerta, unidade = '%', label }: GraficoTendenciaProps) {
  const suffix = unidade === '%' ? '%' : ''

  return (
    <div className="glass-card p-5 animate-fade-in" id="grafico-tendencia">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Tendência — {label ?? 'Últimos meses'}
        </h3>
        <div className="flex items-center gap-4">
          {alerta != null && (
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <span className="w-3 h-px bg-amber-400 inline-block" style={{ borderTop: '2px dashed' }} /> Alerta: {alerta}{suffix}
            </span>
          )}
          {meta != null && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-3 h-px bg-emerald-400 inline-block" style={{ borderTop: '2px dashed' }} /> Meta: {meta}{suffix}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={dados} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
            width={36}
          />
          <Tooltip content={<CustomTooltip unidade={unidade} />} />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            fill="url(#gradientArea)"
            dot={{ r: 4, fill: CHART_COLORS.primary, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
          >
            <LabelList
              dataKey="valor"
              position="top"
              offset={8}
              fill="#94a3b8"
              fontSize={10}
              fontWeight={600}
              formatter={(v: number) => `${v}${suffix}`}
            />
          </Area>
          {meta != null && (
            <ReferenceLine
              y={meta}
              stroke={CHART_COLORS.success}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `Meta: ${meta}${suffix}`, fill: CHART_COLORS.success, fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          {alerta != null && (
            <ReferenceLine
              y={alerta}
              stroke={CHART_COLORS.warning}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `Alerta: ${alerta}${suffix}`, fill: CHART_COLORS.warning, fontSize: 10, position: 'insideTopRight' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label, unidade }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  unidade?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
        {payload[0].value}{unidade === '%' ? '%' : ''}
      </p>
    </div>
  )
}

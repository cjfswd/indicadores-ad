import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { ReactNode } from 'react'

interface ResumoCardProps {
  icon: ReactNode
  label: string
  valor: string | number
  descricao?: string
  variacao?: number | null
  colorClass?: string
  sparkline?: number[]
  sparkColor?: string
}

export function ResumoCard({ icon, label, valor, descricao, variacao, colorClass, sparkline, sparkColor }: ResumoCardProps) {
  const sparkData = sparkline?.map((v, i) => ({ i, v }))

  return (
    <div className="glass-card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className={clsx(
          'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center',
          colorClass ?? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
        )}>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          {variacao != null && <VariacaoBadge variacao={variacao} />}
          {sparkData && sparkData.length > 1 && (
            <div className="w-16 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={sparkColor ?? '#6366f1'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 tabular-nums">
          {valor}
        </p>
        {descricao && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
            {descricao}
          </p>
        )}
      </div>
    </div>
  )
}

function VariacaoBadge({ variacao }: { variacao: number }) {
  const isPositive = variacao > 0
  const isNeutral = variacao === 0

  return (
    <span className={clsx(
      'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
      isNeutral && 'bg-[var(--overlay-soft)] text-[var(--color-text-muted)]',
      isPositive && 'bg-emerald-500/15 text-emerald-400',
      !isPositive && !isNeutral && 'bg-red-500/15 text-red-400',
    )}>
      {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive && '+'}{variacao}
    </span>
  )
}

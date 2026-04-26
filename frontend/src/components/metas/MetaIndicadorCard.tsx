import { Calendar } from 'lucide-react'
import { clsx } from 'clsx'

type Sentido = '↑' | '↓' | '—'

export interface MetaItem {
  codigo: string
  nome: string
  sentido: Sentido
  meta: number | null
  alerta: number | null
  mesInicio: number
  mesFim: number
}

const SENTIDO_LABELS: Record<Sentido, { label: string; color: string }> = {
  '↑': { label: '↑ Maior melhor', color: 'text-emerald-400' },
  '↓': { label: '↓ Menor melhor', color: 'text-amber-400' },
  '—': { label: '— Neutro', color: 'text-[var(--color-text-muted)]' },
}

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const PRESETS = [
  { label: 'Anual', ranges: [[1, 12]] },
  { label: 'Semestral', ranges: [[1, 6], [7, 12]] },
  { label: 'Quadrimestral', ranges: [[1, 4], [5, 8], [9, 12]] },
  { label: 'Trimestral', ranges: [[1, 3], [4, 6], [7, 9], [10, 12]] },
  { label: 'Bimestral', ranges: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12]] },
  { label: 'Mensal', ranges: [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,12]] },
] as const

function periodoLabel(ini: number, fim: number): string {
  if (ini === 1 && fim === 12) return 'Anual'
  if (ini === fim) return MESES_CURTOS[ini - 1]
  return `${MESES_CURTOS[ini - 1]}–${MESES_CURTOS[fim - 1]}`
}

function getActivePreset(ini: number, fim: number): string | null {
  return PRESETS.find(p => p.ranges.some(([i, f]) => i === ini && f === fim))?.label ?? null
}

interface MetaIndicadorCardProps {
  meta: MetaItem
  ano: number
  index: number
  editando: boolean
  onUpdateField: (codigo: string, field: keyof MetaItem, value: unknown) => void
  onUpdateVigencia: (codigo: string, ini: number, fim: number) => void
}

export function MetaIndicadorCard({ meta: m, ano, index, editando, onUpdateField, onUpdateVigencia }: MetaIndicadorCardProps) {
  const activePreset = getActivePreset(m.mesInicio, m.mesFim)

  return (
    <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Indicator info */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--overlay-soft)] px-2 py-1 rounded">{m.codigo}</span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{m.nome}</span>
        </div>

        {/* Sentido */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Sentido</span>
          {editando ? (
            <select value={m.sentido}
              onChange={e => onUpdateField(m.codigo, 'sentido', e.target.value as Sentido)}
              className="px-2 py-1.5 rounded-[var(--radius-sm)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 cursor-pointer">
              <option value="↑">↑ Maior é melhor</option>
              <option value="↓">↓ Menor é melhor</option>
              <option value="—">— Neutro (informativo)</option>
            </select>
          ) : (
            <span className={clsx('text-sm font-medium', SENTIDO_LABELS[m.sentido].color)}>
              {SENTIDO_LABELS[m.sentido].label}
            </span>
          )}
        </div>

        {/* Meta value */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Meta</span>
          {m.sentido === '—' ? (
            <span className="text-sm text-blue-400 italic">Informativo</span>
          ) : editando ? (
            <input type="number" step="0.1" min="0"
              value={m.meta ?? ''}
              onChange={e => onUpdateField(m.codigo, 'meta', e.target.value === '' ? null : Number(e.target.value))}
              className="w-24 px-2 py-1.5 rounded-[var(--radius-sm)] text-sm bg-[var(--color-surface-0)] border border-emerald-500/30 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 tabular-nums"
              placeholder="—" />
          ) : (
            <span className="text-sm text-emerald-400 font-semibold tabular-nums">
              {m.sentido === '↑' ? '≥' : '≤'} {m.meta}
            </span>
          )}
        </div>
      </div>

      {/* Vigência */}
      <div className="mt-3 pt-3 border-t border-[var(--overlay-border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={12} className="text-[var(--color-accent)]" />
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Vigência</span>
          <span className="text-xs text-[var(--color-accent)] font-medium bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full">
            {activePreset ?? periodoLabel(m.mesInicio, m.mesFim)} {ano}
          </span>
          {editando && (
            <>
              <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
              {PRESETS.map(preset => (
                <button key={preset.label}
                  onClick={() => onUpdateVigencia(m.codigo, preset.ranges[0][0], preset.ranges[0][1])}
                  className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
                    activePreset === preset.label
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-surface-0)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]',
                  )}>
                  {preset.label}
                </button>
              ))}
            </>
          )}
        </div>

        {activePreset && activePreset !== 'Anual' && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-5 animate-fade-in">
            {PRESETS.find(p => p.label === activePreset)!.ranges.map(([ini, fim]) => (
              <span key={`${m.codigo}-${ini}-${fim}`}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--overlay-soft)] text-[var(--color-text-muted)] border border-[var(--overlay-border)]">
                {periodoLabel(ini, fim)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rule text */}
      {m.sentido !== '—' && m.meta !== null && (
        <div className="mt-3 pt-3 border-t border-[var(--overlay-border)] text-[11px] text-[var(--color-text-muted)]">
          Meta: valor {m.sentido === '↑' ? '≥' : '≤'} <span className="text-emerald-400 font-semibold">{m.meta}</span>
        </div>
      )}
    </div>
  )
}

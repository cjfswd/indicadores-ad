import { Target, Save, RotateCcw, Calendar } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Combobox } from '@/components/Combobox'
import { AnexoInput } from '@/components/AnexoInput'

type Sentido = '↑' | '↓' | '—'

interface MetaItem {
  codigo: string
  nome: string
  sentido: Sentido
  meta: number | null
  alerta: number | null
  mesInicio: number
  mesFim: number
}

const DEFAULT_METAS: MetaItem[] = [
  { codigo: '01', nome: 'Taxa de Altas (%)', sentido: '↑', meta: 20, alerta: 15, mesInicio: 1, mesFim: 12 },
  { codigo: '02', nome: 'Intercorrências', sentido: '↓', meta: 3, alerta: 6, mesInicio: 1, mesFim: 12 },
  { codigo: '03', nome: 'Taxa Internação (%)', sentido: '↓', meta: 5, alerta: 10, mesInicio: 1, mesFim: 12 },
  { codigo: '04', nome: 'Óbitos', sentido: '↓', meta: 1, alerta: 3, mesInicio: 1, mesFim: 12 },
  { codigo: '05', nome: 'Alteração PAD (%)', sentido: '—', meta: null, alerta: null, mesInicio: 1, mesFim: 12 },
  { codigo: '06', nome: 'Censo AD/ID', sentido: '—', meta: null, alerta: null, mesInicio: 1, mesFim: 12 },
  { codigo: '07', nome: 'Infectados', sentido: '↓', meta: 2, alerta: 5, mesInicio: 1, mesFim: 12 },
  { codigo: '08', nome: 'Eventos Adversos', sentido: '↓', meta: 0, alerta: 2, mesInicio: 1, mesFim: 12 },
  { codigo: '09', nome: 'Reclamações', sentido: '↓', meta: 0, alerta: 2, mesInicio: 1, mesFim: 12 },
]

const SENTIDO_LABELS: Record<Sentido, { label: string; desc: string; color: string }> = {
  '↑': { label: '↑ Maior melhor', desc: 'Quanto maior, melhor', color: 'text-emerald-400' },
  '↓': { label: '↓ Menor melhor', desc: 'Quanto menor, melhor', color: 'text-amber-400' },
  '—': { label: '— Neutro', desc: 'Informativo, sem meta', color: 'text-[var(--color-text-muted)]' },
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
  return PRESETS.find(p =>
    p.ranges.some(([i, f]) => i === ini && f === fim),
  )?.label ?? null
}

export function MetasPage() {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [metas, setMetas] = useState<MetaItem[]>(DEFAULT_METAS)
  const [editando, setEditando] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [arquivoMetas, setArquivoMetas] = useState<File | null>(null)

  const sentidoMap: Record<string, Sentido> = { maior: '↑', menor: '↓', neutro: '—' }
  const sentidoReverseMap: Record<string, string> = { '↑': 'maior', '↓': 'menor', '—': 'neutro' }

  const fetchMetas = useCallback(async () => {
    try {
      const res = await api.get(`/metas?ano=${ano}`)
      const data = res.data as { dados: Array<Record<string, unknown>>; isDefault?: boolean }
      if (data.dados.length > 0) {
        // Deduplicate by indicador_codigo — keep the most recent entry per indicator
        const byCode = new Map<string, Record<string, unknown>>()
        for (const d of data.dados) {
          byCode.set(d.indicador_codigo as string, d)
        }
        setMetas(DEFAULT_METAS.map(def => {
          const d = byCode.get(def.codigo)
          if (!d) return def
          return {
            codigo: d.indicador_codigo as string,
            nome: def.nome,
            sentido: sentidoMap[d.sentido as string] ?? '↓',
            meta: d.meta_valor as number | null,
            alerta: d.limite_alerta as number | null,
            mesInicio: (d.mes_inicio as number) ?? 1,
            mesFim: (d.mes_fim as number) ?? 12,
          }
        }))
      } else {
        setMetas(DEFAULT_METAS)
      }
    } catch {
      setMetas(DEFAULT_METAS)
    }
  }, [ano])

  useEffect(() => { fetchMetas() }, [fetchMetas])

  const updateField = (codigo: string, field: keyof MetaItem, value: unknown) => {
    setMetas(prev => prev.map(m => {
      if (m.codigo !== codigo) return m
      const updated = { ...m, [field]: value }
      if (field === 'sentido' && value === '—') { updated.meta = null; updated.alerta = null }
      if (field === 'sentido' && value !== '—' && m.sentido === '—') { updated.meta = 0; updated.alerta = 0 }
      return updated
    }))
    setUnsaved(true)
  }

  const updateVigencia = (codigo: string, ini: number, fim: number) => {
    setMetas(prev => prev.map(m => m.codigo !== codigo ? m : { ...m, mesInicio: ini, mesFim: fim }))
    setUnsaved(true)
  }

  const salvar = async () => {
    setEditando(false)
    setUnsaved(false)
    try {
      const payload = metas.map(m => ({
        indicador_codigo: m.codigo,
        ano,
        mes_inicio: m.mesInicio,
        mes_fim: m.mesFim,
        meta_valor: m.meta,
        limite_alerta: m.alerta,
        sentido: sentidoReverseMap[m.sentido] ?? 'menor',
      }))
      if (arquivoMetas) {
        const fd = new FormData()
        fd.append('metas', JSON.stringify(payload))
        fd.append('arquivo', arquivoMetas)
        await api.put('/metas', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.put('/metas', payload)
      }
      setArquivoMetas(null)
    } catch (err) {
      console.error('Erro ao salvar metas:', err)
    }
  }

  const resetar = () => { setMetas(DEFAULT_METAS); setUnsaved(false) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Metas</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Configure limiares, sentido e vigência de cada indicador
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unsaved && (
            <span className="text-xs text-amber-400 font-medium animate-pulse-dot mr-2">
              ● Alterações não salvas
            </span>
          )}
          {editando && (
            <button onClick={resetar}
              className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors">
              <RotateCcw size={14} /> Resetar
            </button>
          )}
          <button
            onClick={editando ? salvar : () => setEditando(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
            {editando ? <><Save size={14} /> Salvar</> : <><Target size={14} /> Editar Metas</>}
          </button>
        </div>
        {editando && (
          <div className="mt-2 max-w-xs ml-auto">
            <AnexoInput arquivo={arquivoMetas} onChange={setArquivoMetas} />
          </div>
        )}
      </div>

      {/* Ano selector */}
      <div className="glass-card p-4 flex items-center gap-3 relative z-10">
        <Calendar size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Ano</span>
        <div className="min-w-[100px]">
          <Combobox
            options={Array.from({ length: 11 }, (_, i) => ({ value: String(2020 + i), label: String(2020 + i) }))}
            value={String(ano)}
            onChange={v => v && setAno(Number(v))}
            placeholder="Ano..."
            emptyLabel={String(ano)}
          />
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 px-4 py-3 glass-card">
        <span className="text-xs text-[var(--color-text-muted)] font-medium">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-[var(--color-text-secondary)]">Meta definida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-xs text-[var(--color-text-secondary)]">Informativo (sem meta)</span>
        </div>
      </div>

      {/* Cards por indicador */}
      <div className="space-y-3">
        {metas.map((m, i) => {
          const activePreset = getActivePreset(m.mesInicio, m.mesFim)
          return (
            <div
              key={m.codigo}
              className="glass-card p-5 animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Indicador info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--overlay-soft)] px-2 py-1 rounded">
                    {m.codigo}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{m.nome}</span>
                </div>

                {/* Sentido */}
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Sentido</span>
                  {editando ? (
                    <select
                      value={m.sentido}
                      onChange={e => updateField(m.codigo, 'sentido', e.target.value as Sentido)}
                      className="px-2 py-1.5 rounded-[var(--radius-sm)] text-sm bg-[var(--color-surface-0)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 cursor-pointer"
                    >
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

                {/* Meta */}
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Meta</span>
                  {m.sentido === '—' ? (
                    <span className="text-sm text-blue-400 italic">Informativo</span>
                  ) : editando ? (
                    <input
                      type="number" step="0.1" min="0"
                      value={m.meta ?? ''}
                      onChange={e => updateField(m.codigo, 'meta', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-24 px-2 py-1.5 rounded-[var(--radius-sm)] text-sm bg-[var(--color-surface-0)] border border-emerald-500/30 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 tabular-nums"
                      placeholder="—"
                    />
                  ) : (
                    <span className="text-sm text-emerald-400 font-semibold tabular-nums">
                      {m.sentido === '↑' ? '≥' : '≤'} {m.meta}
                    </span>
                  )}
                </div>
              </div>

              {/* Vigência — inline per indicator */}
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
                          onClick={() => updateVigencia(m.codigo, preset.ranges[0][0], preset.ranges[0][1])}
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

                {/* Divisão dos meses — visual de como o ano fica dividido */}
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

              {/* Regra textual */}
              {m.sentido !== '—' && m.meta !== null && (
                <div className="mt-3 pt-3 border-t border-[var(--overlay-border)] text-[11px] text-[var(--color-text-muted)]">
                  Meta: valor {m.sentido === '↑' ? '≥' : '≤'} <span className="text-emerald-400 font-semibold">{m.meta}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

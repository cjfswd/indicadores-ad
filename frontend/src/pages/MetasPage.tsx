import { Target, Save, RotateCcw, Calendar } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { PageHeader } from '@/components/PageHeader'
import { Combobox } from '@/components/Combobox'
import { AnexoInput } from '@/components/AnexoInput'
import { MetaIndicadorCard, type MetaItem } from '@/components/metas/MetaIndicadorCard'

type Sentido = '↑' | '↓' | '—'

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

const sentidoMap: Record<string, Sentido> = { maior: '↑', menor: '↓', neutro: '—' }
const sentidoReverseMap: Record<string, string> = { '↑': 'maior', '↓': 'menor', '—': 'neutro' }

export function MetasPage() {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [metas, setMetas] = useState<MetaItem[]>(DEFAULT_METAS)
  const [editando, setEditando] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [arquivoMetas, setArquivoMetas] = useState<File | null>(null)

  const fetchMetas = useCallback(async () => {
    try {
      const data = await apiClient.metas.listar(ano)
      if (data.dados.length > 0) {
        const byCode = new Map<string, Record<string, unknown>>()
        for (const d of data.dados) byCode.set(d.indicador_codigo, d as unknown as Record<string, unknown>)
        setMetas(DEFAULT_METAS.map(def => {
          const d = byCode.get(def.codigo)
          if (!d) return def
          return {
            codigo: d.indicador_codigo as string, nome: def.nome,
            sentido: sentidoMap[d.sentido as string] ?? '↓',
            meta: d.meta_valor as number | null, alerta: d.limite_alerta as number | null,
            mesInicio: (d.mes_inicio as number) ?? 1, mesFim: (d.mes_fim as number) ?? 12,
          }
        }))
      } else {
        setMetas(DEFAULT_METAS)
      }
    } catch { setMetas(DEFAULT_METAS) }
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
    setEditando(false); setUnsaved(false)
    try {
      const payload = metas.map(m => ({
        indicador_codigo: m.codigo, ano, mes_inicio: m.mesInicio, mes_fim: m.mesFim,
        meta_valor: m.meta, limite_alerta: m.alerta, sentido: sentidoReverseMap[m.sentido] ?? 'menor',
      }))
      if (arquivoMetas) {
        const fd = new FormData(); fd.append('metas', JSON.stringify(payload)); fd.append('arquivo', arquivoMetas)
        await apiClient.metas.salvarComArquivo(fd)
      } else {
        await apiClient.metas.salvar(payload)
      }
      setArquivoMetas(null)
    } catch (err) { console.error('Erro ao salvar metas:', err) }
  }

  const resetar = () => { setMetas(DEFAULT_METAS); setUnsaved(false) }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Target size={20} />}
        iconClassName="bg-amber-500/15 text-amber-400"
        title="Metas"
        subtitle="Configure limiares, sentido e vigência de cada indicador"
        actions={
          <div className="flex items-center gap-2">
            {unsaved && <span className="text-xs text-amber-400 font-medium animate-pulse-dot mr-2">● Alterações não salvas</span>}
            {editando && (
              <button onClick={resetar}
                className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)] transition-colors">
                <RotateCcw size={14} /> Resetar
              </button>
            )}
            <button onClick={editando ? salvar : () => setEditando(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">
              {editando ? <><Save size={14} /> Salvar</> : <><Target size={14} /> Editar Metas</>}
            </button>
          </div>
        }
      />

      {editando && (
        <div className="max-w-xs ml-auto">
          <AnexoInput arquivo={arquivoMetas} onChange={setArquivoMetas} />
        </div>
      )}

      {/* Year selector */}
      <div className="glass-card p-3 sm:p-4 flex items-center gap-3 relative z-10">
        <Calendar size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Ano</span>
        <div className="min-w-[100px]">
          <Combobox
            options={Array.from({ length: 11 }, (_, i) => ({ value: String(2020 + i), label: String(2020 + i) }))}
            value={String(ano)} onChange={v => v && setAno(Number(v))}
            placeholder="Ano..." emptyLabel={String(ano)} />
        </div>
      </div>

      {/* Legend */}
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

      {/* Cards */}
      <div className="space-y-3">
        {metas.map((m, i) => (
          <MetaIndicadorCard key={m.codigo} meta={m} ano={ano} index={i}
            editando={editando} onUpdateField={updateField} onUpdateVigencia={updateVigencia} />
        ))}
      </div>
    </div>
  )
}

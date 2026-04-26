import type { FC } from 'hono/jsx'
import { TIPO_EVENTO_LABELS, MESES } from '../helpers.js'

interface Evento { id: string; tipo_evento: string; paciente_nome: string | null; data_evento: string | null; descricao: string | null }
interface RegistroDetailProps {
  registro: Record<string, unknown> | null; ano: number; mes: number; eventos: Evento[]
}

const GRUPOS = [
  { titulo: 'Movimentação', items: [{ key: 'alta', label: 'Altas' }, { key: 'obito', label: 'Óbitos' }, { key: 'obito_menos_48h', label: 'Óbitos <48h' }, { key: 'obito_mais_48h', label: 'Óbitos ≥48h' }] },
  { titulo: 'Internações', items: [{ key: 'intern_deterioracao', label: 'Deterioração' }, { key: 'intern_nao_aderencia', label: 'Não Aderência' }] },
  { titulo: 'Eventos Adversos', items: [{ key: 'ea_queda', label: 'Quedas' }, { key: 'ea_broncoaspiracao', label: 'Broncoaspiração' }, { key: 'ea_lesao_pressura', label: 'Lesão Pressão' }, { key: 'ea_decanulacao', label: 'Decanulação' }, { key: 'ea_saida_gtt', label: 'Saída GTT' }] },
  { titulo: 'Intercorrências', items: [{ key: 'intercorr_removida_dom', label: 'Removida Domicílio' }, { key: 'intercorr_necessidade_rem', label: 'Necessidade Remoção' }] },
  { titulo: 'Ouvidoria', items: [{ key: 'ouvidoria_elogio', label: 'Elogios' }, { key: 'ouvidoria_sugestao', label: 'Sugestões' }, { key: 'ouvidoria_reclamacao', label: 'Reclamações' }] },
]

export const RegistroDetail: FC<RegistroDetailProps> = ({ registro, ano, mes, eventos }) => {
  const r = registro as Record<string, unknown> | null
  const num = (k: string) => Number(r?.[k] ?? 0)
  const confirmado = r?.confirmado === true || r?.confirmado === 1

  return (
    <>
      <div class="flex items-center justify-between" style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:var(--color-text-primary)">{MESES[mes]} {ano}</h3>
        <div class="flex items-center gap-2">
          {confirmado
            ? <span class="badge" style="background:rgba(16,185,129,.15);color:#34d399">✓ Confirmado</span>
            : r && <button class="btn btn-primary btn-sm" hx-put={`/registros/${(r as Record<string,unknown>).id}/confirmar`} hx-target="#registro-content" hx-swap="innerHTML">Confirmar Mês</button>}
        </div>
      </div>
      <div class="space-y-4">
        {GRUPOS.map(grupo => (
          <div class="glass-card no-hover" style="padding:1rem">
            <h4 style="font-size:.875rem;font-weight:600;color:var(--color-text-primary);margin-bottom:.75rem">{grupo.titulo}</h4>
            <div class="grid grid-2 gap-3" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
              {grupo.items.map(item => {
                const valor = num(item.key)
                const label = TIPO_EVENTO_LABELS[item.key] ?? item.label
                return (
                  <div class="flex items-center justify-between" style="padding:.5rem .75rem;border-radius:var(--radius-sm);background:var(--overlay-soft)">
                    <div>
                      <span style="font-size:.75rem;color:var(--color-text-muted)">{label}</span>
                      <div style="font-size:1.125rem;font-weight:700;color:var(--color-text-primary);font-variant-numeric:tabular-nums">{valor}</div>
                    </div>
                    <button class="btn btn-sm btn-ghost" style="font-size:.75rem;color:var(--color-accent)" hx-get={`/registros/modal/evento?tipo=${item.key}&label=${encodeURIComponent(label)}&ano=${ano}&mes=${mes}`} hx-target="#modal-container" hx-swap="innerHTML" title="Registrar evento">+</button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {eventos.length > 0 && (
        <div style="margin-top:1.5rem">
          <h4 style="font-size:.875rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem">Eventos Registrados ({eventos.length})</h4>
          <div class="space-y-2">
            {eventos.map(ev => (
              <div class="glass-card no-hover" style="padding:.75rem 1rem">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="badge badge-muted" style="margin-right:.5rem">{TIPO_EVENTO_LABELS[ev.tipo_evento] ?? ev.tipo_evento}</span>
                    <span style="font-size:.875rem;color:var(--color-text-primary)">{ev.paciente_nome ?? '—'}</span>
                    {ev.descricao && <p style="font-size:.75rem;color:var(--color-text-muted);margin-top:.25rem">{ev.descricao}</p>}
                  </div>
                  <button class="btn btn-sm btn-ghost" style="color:#f87171" hx-get={`/registros/modal/excluir-evento/${ev.id}`} hx-target="#modal-container" hx-swap="innerHTML" title="Remover evento">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

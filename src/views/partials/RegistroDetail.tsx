import type { FC } from 'hono/jsx'
import { TIPO_EVENTO_LABELS, MESES } from '../helpers.js'
import { Plus, Trash2, Check } from '../components/Icons.js'
import { CARD, BTN_SM, BTN_ICON, BADGE } from '../ui.js'

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
    <div class="flex flex-col gap-4 sm:gap-6">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-(--color-text-primary)">{MESES[mes]} {ano}</h3>
        <div class="flex items-center gap-2">
          {confirmado
            ? <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400"><Check size={12} /> Confirmado</span>
            : r && <button class={`${BTN_SM} bg-(--color-accent) text-white hover:bg-(--color-accent-hover)`} hx-put={`/registros/${(r as Record<string,unknown>).id}/confirmar`} hx-target="#registro-content" hx-swap="innerHTML"><Check size={14} /> Confirmar Mês</button>}
        </div>
      </div>
      <div class="flex flex-col gap-4">
        {GRUPOS.map(grupo => (
          <div class={CARD}>
            <h4 class="text-sm font-semibold text-(--color-text-primary) mb-3">{grupo.titulo}</h4>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {grupo.items.map(item => {
                const valor = num(item.key)
                const label = TIPO_EVENTO_LABELS[item.key] ?? item.label
                return (
                  <div class="flex items-center justify-between py-2 px-3 rounded-md bg-[var(--overlay-soft)]">
                    <div>
                      <span class="text-xs text-(--color-text-muted)">{label}</span>
                      <div class="text-lg font-bold text-(--color-text-primary) tabular-nums">{valor}</div>
                    </div>
                    <button class={`${BTN_ICON} text-(--color-accent)`} hx-get={`/registros/modal/evento?tipo=${item.key}&label=${encodeURIComponent(label)}&ano=${ano}&mes=${mes}`} hx-target="#modal-container" hx-swap="innerHTML" title="Registrar evento">
                      <Plus size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {eventos.length > 0 && (
        <div>
          <h4 class="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wide mb-3">Eventos Registrados ({eventos.length})</h4>
          <div class="flex flex-col gap-2">
            {eventos.map(ev => (
              <div class={`${CARD} !py-3 !px-4`}>
                <div class="flex items-center justify-between">
                  <div>
                    <span class={`${BADGE} mr-2`}>{TIPO_EVENTO_LABELS[ev.tipo_evento] ?? ev.tipo_evento}</span>
                    <span class="text-sm text-(--color-text-primary)">{ev.paciente_nome ?? '—'}</span>
                    {ev.descricao && <p class="text-xs text-(--color-text-muted) mt-1">{ev.descricao}</p>}
                  </div>
                  <button class={`${BTN_ICON} text-red-400 hover:text-red-300`} hx-get={`/registros/modal/excluir-evento/${ev.id}`} hx-target="#modal-container" hx-swap="innerHTML" title="Remover evento">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

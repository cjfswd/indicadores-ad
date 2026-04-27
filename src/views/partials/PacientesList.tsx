import type { FC } from 'hono/jsx'
import { calcularIdade } from '../helpers.js'
import { Pencil, Trash2, Pause, Play } from '../components/Icons.js'
import { CARD, BTN_ICON } from '../ui.js'

interface Paciente {
  id: string; nome: string; convenio: string; modalidade: string
  data_nascimento: string | null; status: string; observacoes: string | null
}

export const PacientesList: FC<{ agrupados: Record<string, Paciente[]> }> = ({ agrupados }) => {
  const entries = Object.entries(agrupados)

  if (entries.length === 0) {
    return <div class="text-center py-16 text-(--color-text-muted)"><p class="text-sm">Nenhum paciente encontrado</p></div>
  }

  return (
    <div class="flex flex-col gap-4 sm:gap-6">
      {entries.map(([convenio, lista]) => (
        <div>
          <h3 class="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest mb-3">{convenio} ({lista.length})</h3>
          <div class="flex flex-col gap-2">
            {lista.map((p, i) => (
              <div class={`${CARD} !py-3 !px-4`} style={`animation:fadeIn .3s ease ${i * 40}ms both`}>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-(--color-accent)/15 text-(--color-accent) flex items-center justify-center text-sm font-bold shrink-0">{p.nome.charAt(0)}</div>
                    <div>
                      <p class="text-sm font-semibold text-(--color-text-primary)">{p.nome}</p>
                      <div class="flex items-center gap-2 text-[.6875rem] text-(--color-text-muted) mt-0.5">
                        <span class="inline-block px-1.5 py-0.5 rounded text-[.625rem] font-bold bg-(--color-accent)/15 text-(--color-accent)">{p.modalidade}</span>
                        {p.data_nascimento && <span>{calcularIdade(p.data_nascimento)} anos</span>}
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <button class={`${BTN_ICON} text-(--color-text-secondary) hover:text-(--color-text-primary)`} hx-get={`/pacientes/${p.id}/modal/editar`} hx-target="#modal-container" hx-swap="innerHTML" title="Editar">
                      <Pencil size={14} />
                    </button>
                    {p.status === 'ativo' ? (
                      <button class={`${BTN_ICON} text-amber-300 hover:text-amber-200`} hx-get={`/pacientes/${p.id}/modal/desativar`} hx-target="#modal-container" hx-swap="innerHTML" title="Desativar">
                        <Pause size={14} />
                      </button>
                    ) : (
                      <button class={`${BTN_ICON} text-teal-300 hover:text-teal-200`} hx-put={`/pacientes/${p.id}/reativar`} hx-target="#pacientes-content" hx-swap="innerHTML" title="Reativar">
                        <Play size={14} />
                      </button>
                    )}
                    <button class={`${BTN_ICON} text-red-400 hover:text-red-300`} hx-get={`/pacientes/${p.id}/modal/excluir`} hx-target="#modal-container" hx-swap="innerHTML" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

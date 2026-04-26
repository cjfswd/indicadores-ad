import type { FC } from 'hono/jsx'
import { calcularIdade } from '../helpers.js'

interface Paciente {
  id: string; nome: string; convenio: string; modalidade: string
  status: string; data_nascimento: string | null; motivo_desativacao: string | null
}

export const PacientesList: FC<{ agrupados: Record<string, Paciente[]> }> = ({ agrupados }) => {
  const grupos = Object.entries(agrupados)
  if (grupos.length === 0) {
    return (
      <div style="text-align:center;padding:4rem 0;color:var(--color-text-muted)">
        <p style="font-size:.875rem">Nenhum paciente encontrado</p>
      </div>
    )
  }
  return (
    <div class="space-y-6">
      {grupos.map(([convenio, pacientes]) => (
        <div>
          <h3 style="font-size:.875rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem;padding-left:.25rem">{convenio} <span style="opacity:.5;font-weight:400">({pacientes.length})</span></h3>
          <div class="space-y-2">
            {pacientes.map((p, i) => {
              const idade = calcularIdade(p.data_nascimento)
              return (
                <div class="glass-card no-hover" style={`padding:.875rem 1rem;animation:fadeIn .3s ease ${i * 30}ms both`}>
                  <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:.5rem">
                    <div class="flex items-center gap-3">
                      <div style={`width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600;${p.status === 'inativo' ? 'background:rgba(245,158,11,.15);color:#fbbf24' : 'background:rgba(59,130,246,.15);color:#60a5fa'}`}>
                        {p.nome.charAt(0)}
                      </div>
                      <div>
                        <span style="font-weight:600;color:var(--color-text-primary)">{p.nome}</span>
                        <div class="flex items-center gap-2" style="margin-top:.125rem">
                          <span class="badge badge-muted">{p.modalidade}</span>
                          {idade !== null && <span style="font-size:.6875rem;color:var(--color-text-muted)">{idade} anos</span>}
                          {p.status === 'inativo' && <span style="font-size:.625rem;font-weight:500;color:#fbbf24;background:rgba(245,158,11,.1);padding:.125rem .375rem;border-radius:.25rem">INATIVO</span>}
                          {p.motivo_desativacao && <span style="font-size:.625rem;color:var(--color-text-muted);font-style:italic">{p.motivo_desativacao}</span>}
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-1">
                      <button class="btn btn-sm btn-ghost" hx-get={`/pacientes/${p.id}/modal/editar`} hx-target="#modal-container" hx-swap="innerHTML" title="Editar">✏️</button>
                      {p.status === 'ativo' ? (
                        <button class="btn btn-sm btn-ghost" hx-get={`/pacientes/${p.id}/modal/desativar`} hx-target="#modal-container" hx-swap="innerHTML" title="Desativar" style="color:#fbbf24">⏸</button>
                      ) : p.status === 'inativo' ? (
                        <button class="btn btn-sm btn-ghost" hx-put={`/pacientes/${p.id}/reativar`} hx-target="#pacientes-content" hx-swap="innerHTML" title="Reativar" style="color:#34d399">▶</button>
                      ) : null}
                      <button class="btn btn-sm btn-ghost" hx-get={`/pacientes/${p.id}/modal/excluir`} hx-target="#modal-container" hx-swap="innerHTML" title="Excluir" style="color:#f87171">🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

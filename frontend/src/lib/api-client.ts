import { api } from './api'

// ═══════════════════════════════════════════════════════════════
// Response Types — inferred from backend route handlers
// ═══════════════════════════════════════════════════════════════

export interface PacienteResponse {
  id: string
  nome: string
  data_nascimento: string | null
  convenio: 'Camperj' | 'Unimed'
  modalidade: 'AD' | 'ID'
  observacoes: string | null
  ativo: boolean
  motivo_desativacao: string | null
  indicador_desativacao: string | null
  criado_por: string | null
  criado_em: string
  atualizado_em: string
}

export interface PacienteListResponse {
  dados: PacienteResponse[]
  agrupado: Record<string, PacienteResponse[]>
  total: number
}

export interface EventoResponse {
  id: string
  paciente_id: string
  registro_id: string | null
  ano: number
  mes: number
  tipo_evento: string
  subtipo: string | null
  data_evento: string
  observacao_texto: string | null
  documentacao_url: string | null
  descricao: string | null
  registrado_por: string | null
  ativo: boolean
  criado_em: string
  paciente_nome: string | null
  paciente_convenio: string | null
  paciente_modalidade: string | null
}

export interface EventoListResponse {
  dados: EventoResponse[]
  total: number
}

export interface RegistroMensalResponse {
  id: string
  ano: number
  mes: number
  taxa_altas_pct: number
  intercorrencias_total: number
  intercorr_removidas_dom: number
  intercorr_necessidade_rem: number
  taxa_internacao_pct: number
  intern_deterioracao: number
  intern_nao_aderencia: number
  obitos_total: number
  obitos_menos_48h: number
  obitos_mais_48h: number
  taxa_alteracao_pad_pct: number
  pacientes_total: number
  pacientes_ad: number
  pacientes_id: number
  pacientes_infectados: number
  infeccao_atb_48h: number
  eventos_adversos_total: number
  ea_quedas: number
  ea_broncoaspiracao: number
  ea_lesao_pressao: number
  ea_decanulacao: number
  ea_saida_gtt: number
  ouvidorias_total: number
  ouv_elogios: number
  ouv_sugestoes: number
  ouv_reclamacoes: number
  status: 'rascunho' | 'confirmado'
  criado_por: string | null
  atualizado_por: string | null
  criado_em: string
  atualizado_em: string
}

export interface MetaResponse {
  id: string
  indicador_codigo: string
  ano: number
  mes_inicio: number
  mes_fim: number
  meta_valor: number | null
  limite_alerta: number | null
  sentido: 'maior' | 'menor' | 'neutro'
  atualizado_em: string
}

export interface MetaListResponse {
  dados: MetaResponse[]
  ano: number
  mes_inicio: number
  mes_fim: number
  isDefault?: boolean
}

export interface SemaforoIndicador {
  codigo: string
  nome: string
  valor: number
  status: 'verde' | 'amarelo' | 'vermelho' | 'neutro'
  meta: number | null
  alerta: number | null
  variacao: number | null
}

export interface SemaforoResponse {
  indicadores: SemaforoIndicador[]
  ano: number
  mes: number
}

export interface AuditEntry {
  id: string
  entidade: string
  entidade_id: string
  acao: string
  campo_alterado: string | null
  valor_anterior: string | null
  valor_novo: string | null
  usuario_email: string | null
  timestamp: string
  justificativa: string | null
  documentacao_url: string | null
  payload: string | null
  revertido: boolean
  revertido_por: string | null
  reverte_ref: string | null
}

export interface AuditListResponse {
  dados: AuditEntry[]
  paginacao: {
    pagina_atual: number
    por_pagina: number
    total_registros: number
    total_paginas: number
  }
}

export interface AuditHistoryResponse {
  dados: AuditEntry[]
}

export interface RevertResponse {
  message: string
  acao_original: string
  entidade: string
  reversal_id: string
  original_id: string
}

// ═══════════════════════════════════════════════════════════════
// Request Payloads
// ═══════════════════════════════════════════════════════════════

export interface PacienteCriarPayload {
  nome: string
  convenio: 'Camperj' | 'Unimed'
  modalidade: 'AD' | 'ID'
  data_nascimento?: string | null
  observacoes?: string | null
}

export interface PacienteDesativarPayload {
  justificativa: string
  motivo: string
  indicador?: string
}

export interface PacienteReativarPayload {
  justificativa?: string
}

export interface MetaSalvarItem {
  indicador_codigo: string
  ano: number
  mes_inicio: number
  mes_fim: number
  meta_valor: number | null
  limite_alerta: number | null
  sentido: string
}

export interface AuditFiltros {
  pagina?: number
  por_pagina?: number
  entidade?: string
  acao?: string
  entidade_id?: string
  inicio?: string
  fim?: string
}

// ═══════════════════════════════════════════════════════════════
// API Client
// ═══════════════════════════════════════════════════════════════

function extractData<T>(res: { data: T }): T {
  return res.data
}

export const apiClient = {
  // ── Pacientes ──────────────────────────────────────────────
  pacientes: {
    listar(params?: { convenio?: string; ativo?: boolean; busca?: string }) {
      const query = new URLSearchParams()
      if (params?.convenio) query.set('convenio', params.convenio)
      if (params?.ativo !== undefined) query.set('ativo', String(params.ativo))
      if (params?.busca) query.set('busca', params.busca)
      const qs = query.toString()
      return api.get<PacienteListResponse>(`/pacientes${qs ? `?${qs}` : ''}`).then(extractData)
    },

    buscar(id: string) {
      return api.get<PacienteResponse>(`/pacientes/${id}`).then(extractData)
    },

    criar(payload: PacienteCriarPayload) {
      return api.post<PacienteResponse>('/pacientes', payload).then(extractData)
    },

    editar(id: string, payload: PacienteCriarPayload & { justificativa?: string }) {
      return api.put<PacienteResponse>(`/pacientes/${id}`, payload).then(extractData)
    },

    desativar(id: string, payload: PacienteDesativarPayload) {
      return api.post<{ message: string; id: string }>(`/pacientes/${id}/desativar`, payload).then(extractData)
    },

    reativar(id: string, payload?: PacienteReativarPayload) {
      return api.post<PacienteResponse>(`/pacientes/${id}/reativar`, payload ?? {}).then(extractData)
    },

    transferir(id: string, payload: { convenio: 'Camperj' | 'Unimed'; justificativa?: string }) {
      return api.put<PacienteResponse>(`/pacientes/${id}/transferir`, payload).then(extractData)
    },
  },

  // ── Eventos ────────────────────────────────────────────────
  eventos: {
    listar(params: { ano: number; mes: number; tipo_evento?: string; paciente_id?: string }) {
      const query = new URLSearchParams({
        ano: String(params.ano),
        mes: String(params.mes),
      })
      if (params.tipo_evento) query.set('tipo_evento', params.tipo_evento)
      if (params.paciente_id) query.set('paciente_id', params.paciente_id)
      return api.get<EventoListResponse>(`/eventos?${query}`).then(extractData)
    },

    criar(fd: FormData) {
      return api.post<EventoResponse>('/eventos', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(extractData)
    },

    excluir(id: string, fd: FormData) {
      return api.post('/eventos/' + id + '/reverter', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },

    reRegistrar(fd: FormData) {
      return api.post<EventoResponse>('/eventos/re-registrar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(extractData)
    },
  },

  // ── Registros Mensais ──────────────────────────────────────
  registros: {
    listarAno(ano: number) {
      return api.get<{ dados: RegistroMensalResponse[]; ano: number }>(`/registros?ano=${ano}`).then(extractData)
    },

    buscarMes(ano: number, mes: number) {
      return api.get<RegistroMensalResponse>(`/registros/${ano}/${mes}`).then(extractData)
    },

    buscarRange(inicio: string, fim: string) {
      return api.get<{ dados: RegistroMensalResponse[]; inicio: string; fim: string }>(
        `/registros/range?inicio=${inicio}&fim=${fim}`,
      ).then(extractData)
    },

    criar(payload: { ano: number; mes: number }) {
      return api.post<RegistroMensalResponse>('/registros', payload).then(extractData)
    },

    editar(id: string, payload: Record<string, unknown>) {
      return api.put<RegistroMensalResponse>(`/registros/${id}`, payload).then(extractData)
    },

    confirmar(id: string) {
      return api.put<RegistroMensalResponse>(`/registros/${id}/confirmar`).then(extractData)
    },
  },

  // ── Metas ──────────────────────────────────────────────────
  metas: {
    listar(ano: number) {
      return api.get<MetaListResponse>(`/metas?ano=${ano}`).then(extractData)
    },

    salvar(payload: MetaSalvarItem[]) {
      return api.put<{ dados: MetaResponse[] }>('/metas', payload).then(extractData)
    },

    salvarComArquivo(fd: FormData) {
      return api.put<{ dados: MetaResponse[] }>('/metas', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(extractData)
    },
  },

  // ── Semáforo ───────────────────────────────────────────────
  semaforo: {
    buscar(ano: number, mes: number) {
      return api.get<SemaforoResponse>(`/semaforo/${ano}/${mes}`).then(extractData)
    },
  },

  // ── Auditoria ──────────────────────────────────────────────
  auditoria: {
    listar(filtros?: AuditFiltros) {
      const query = new URLSearchParams()
      if (filtros?.pagina) query.set('pagina', String(filtros.pagina))
      if (filtros?.por_pagina) query.set('por_pagina', String(filtros.por_pagina))
      if (filtros?.entidade) query.set('entidade', filtros.entidade)
      if (filtros?.acao) query.set('acao', filtros.acao)
      if (filtros?.entidade_id) query.set('entidade_id', filtros.entidade_id)
      if (filtros?.inicio) query.set('inicio', filtros.inicio)
      if (filtros?.fim) query.set('fim', filtros.fim)
      const qs = query.toString()
      return api.get<AuditListResponse>(`/auditoria${qs ? `?${qs}` : ''}`).then(extractData)
    },

    historico(entidade: string, id: string) {
      return api.get<AuditHistoryResponse>(`/auditoria/${entidade}/${id}`).then(extractData)
    },

    reverter(auditId: string, fd: FormData) {
      return api.post<RevertResponse>(`/auditoria/${auditId}/reverter`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(extractData)
    },
  },
} as const

import type { Generated } from 'kysely'

// ── Table interfaces ──

export interface UsuarioTable {
  id: string
  nome: string
  email: string
  google_sub: string | null
  perfil: 'admin' | 'editor' | 'visualizador'
  ativo: Generated<number>
  criado_em: Generated<string>
  ultimo_login: string | null
  ultimo_ip: string | null
}

export interface RegistroMensalTable {
  id: string
  ano: number
  mes: number
  taxa_altas_pct: number | null
  intercorrencias_total: number | null
  intercorr_removidas_dom: number | null
  intercorr_necessidade_rem: number | null
  taxa_internacao_pct: number | null
  intern_deterioracao: number | null
  intern_nao_aderencia: number | null
  obitos_total: number | null
  obitos_menos_48h: number | null
  obitos_mais_48h: number | null
  taxa_alteracao_pad_pct: number | null
  pacientes_total: number | null
  pacientes_ad: number | null
  pacientes_id: number | null
  pacientes_infectados: number | null
  infeccao_atb_48h: number | null
  eventos_adversos_total: number | null
  ea_quedas: number | null
  ea_broncoaspiracao: number | null
  ea_lesao_pressao: number | null
  ea_decanulacao: number | null
  ea_saida_gtt: number | null
  ouvidorias_total: number | null
  ouv_elogios: number | null
  ouv_sugestoes: number | null
  ouv_reclamacoes: number | null
  status: Generated<'rascunho' | 'confirmado'>
  criado_por: string | null
  atualizado_por: string | null
  criado_em: Generated<string>
  atualizado_em: Generated<string>
}

export interface PacienteTable {
  id: string
  nome: string
  data_nascimento: string | null
  convenio: 'Camperj' | 'Unimed'
  modalidade: 'AD' | 'ID'
  observacoes: string | null
  ativo: Generated<number>
  motivo_desativacao: string | null
  indicador_desativacao: string | null
  criado_por: string | null
  criado_em: Generated<string>
  atualizado_em: Generated<string>
}

export interface EventoPacienteTable {
  id: string
  paciente_id: string
  registro_id: string | null
  ano: number | null
  mes: number | null
  tipo_evento: string
  subtipo: string | null
  data_evento: string | null
  observacao_texto: string | null
  documentacao_url: string | null
  descricao: string | null
  registrado_por: string | null
  ativo: Generated<number>
  criado_em: Generated<string>
}

export interface MetaTable {
  id: string
  indicador_codigo: string
  ano: number
  mes_inicio: Generated<number>
  mes_fim: Generated<number>
  meta_valor: number | null
  limite_alerta: number | null
  sentido: Generated<'maior' | 'menor' | 'neutro'>
  atualizado_por: string | null
  atualizado_em: Generated<string>
}

export type AuditAcao =
  | 'criar' | 'editar' | 'confirmar' | 'excluir'
  | 'reverter' | 'reverter_criacao' | 'reverter_exclusao'
  | 'reverter_edicao' | 'reverter_confirmacao'
  | 'reverter_desativacao' | 'reverter_reativacao'
  | 'desativar' | 'reativar'

export interface AuditLogTable {
  id: string
  entidade: string
  entidade_id: string
  acao: AuditAcao
  campo_alterado: string | null
  valor_anterior: string | null
  valor_novo: string | null
  usuario_id: string | null
  usuario_email: string | null
  ip: string | null
  user_agent: string | null
  timestamp: Generated<string>
  justificativa: string | null
  documentacao_url: string | null
  payload: string | null
  revertido: Generated<number>
  revertido_por: string | null
  reverte_ref: string | null
}

// ── Database aggregate ──

export interface Database {
  usuarios: UsuarioTable
  registros_mensais: RegistroMensalTable
  pacientes: PacienteTable
  eventos_pacientes: EventoPacienteTable
  metas: MetaTable
  audit_log: AuditLogTable
}

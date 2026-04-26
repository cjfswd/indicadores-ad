-- Migration 001: Initial schema for Indicadores AD
-- Target: PostgreSQL 14+

BEGIN;

-- ── Usuarios ──
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  google_sub TEXT UNIQUE,
  perfil TEXT NOT NULL DEFAULT 'editor' CHECK(perfil IN ('admin','editor','visualizador')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_login TIMESTAMPTZ,
  ultimo_ip TEXT
);

-- ── Registros Mensais ──
CREATE TABLE IF NOT EXISTS registros_mensais (
  id UUID PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK(mes BETWEEN 1 AND 12),
  taxa_altas_pct REAL,
  intercorrencias_total INTEGER,
  intercorr_removidas_dom INTEGER,
  intercorr_necessidade_rem INTEGER,
  taxa_internacao_pct REAL,
  intern_deterioracao INTEGER,
  intern_nao_aderencia INTEGER,
  obitos_total INTEGER,
  obitos_menos_48h INTEGER,
  obitos_mais_48h INTEGER,
  taxa_alteracao_pad_pct REAL,
  pacientes_total INTEGER,
  pacientes_ad INTEGER,
  pacientes_id INTEGER,
  pacientes_infectados INTEGER,
  infeccao_atb_48h INTEGER,
  eventos_adversos_total INTEGER,
  ea_quedas INTEGER,
  ea_broncoaspiracao INTEGER,
  ea_lesao_pressao INTEGER,
  ea_decanulacao INTEGER,
  ea_saida_gtt INTEGER,
  ouvidorias_total INTEGER,
  ouv_elogios INTEGER,
  ouv_sugestoes INTEGER,
  ouv_reclamacoes INTEGER,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK(status IN ('rascunho','confirmado')),
  criado_por TEXT,
  atualizado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ano, mes)
);

-- ── Pacientes ──
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  data_nascimento TEXT,
  convenio TEXT NOT NULL CHECK(convenio IN ('Camperj','Unimed')),
  modalidade TEXT NOT NULL CHECK(modalidade IN ('AD','ID')),
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo','inativo','excluido')),
  motivo_desativacao TEXT,
  indicador_desativacao TEXT,
  criado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Eventos Pacientes ──
CREATE TABLE IF NOT EXISTS eventos_pacientes (
  id UUID PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  registro_id UUID REFERENCES registros_mensais(id),
  ano INTEGER,
  mes INTEGER,
  tipo_evento TEXT NOT NULL,
  subtipo TEXT,
  data_evento TEXT,
  observacao_texto TEXT,
  documentacao_url TEXT,
  descricao TEXT,
  registrado_por TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo','excluido')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Metas ──
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY,
  indicador_codigo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  mes_inicio INTEGER NOT NULL DEFAULT 1,
  mes_fim INTEGER NOT NULL DEFAULT 12,
  meta_valor REAL,
  limite_alerta REAL,
  sentido TEXT NOT NULL DEFAULT 'menor' CHECK(sentido IN ('maior','menor','neutro')),
  atualizado_por TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(indicador_codigo, ano, mes_inicio, mes_fim)
);

-- ── Audit Log ──
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  acao TEXT NOT NULL CHECK(acao IN ('criar','editar','confirmar','excluir','reverter','reverter_criacao','reverter_exclusao','reverter_edicao','reverter_confirmacao','reverter_desativacao','reverter_reativacao','desativar','reativar')),
  campo_alterado TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID,
  usuario_email TEXT,
  ip TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  justificativa TEXT,
  documentacao_url TEXT,
  payload TEXT,
  revertido BOOLEAN NOT NULL DEFAULT false,
  revertido_por UUID REFERENCES audit_log(id),
  reverte_ref UUID REFERENCES audit_log(id)
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_registros_ano_mes ON registros_mensais(ano, mes);
CREATE INDEX IF NOT EXISTS idx_pacientes_convenio ON pacientes(convenio);
CREATE INDEX IF NOT EXISTS idx_pacientes_status ON pacientes(status);
CREATE INDEX IF NOT EXISTS idx_eventos_paciente ON eventos_pacientes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_eventos_ano_mes ON eventos_pacientes(ano, mes);
CREATE INDEX IF NOT EXISTS idx_metas_indicador_ano ON metas(indicador_codigo, ano);
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);

COMMIT;

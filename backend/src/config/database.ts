import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { Database } from './db.schema.js'
import { logger } from '../lib/logger.js'

let db: Kysely<Database>

const DATABASE_URL = process.env.DATABASE_URL ?? ''
const isPostgres = DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')

export async function initializeDatabase() {
  if (isPostgres) {
    // ── Production: PostgreSQL ──
    const pool = new pg.Pool({ connectionString: DATABASE_URL })

    db = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })

    // Verify connection
    await db.selectFrom('usuarios').select('id').limit(1).execute()
      .catch(async (err) => {
        // Table might not exist yet — that's ok if migrations haven't run
        if ((err as { code?: string }).code === '42P01') {
          logger.warn('Tabelas não encontradas. Execute: pnpm run migrate')
          return
        }
        throw err
      })

    logger.info('Database PostgreSQL conectado')
  } else {
    // ── Development: SQLite in-memory (sql.js) ──
    const initSqlJs = (await import('sql.js')).default
    const { SqlJsDialect } = await import('./kysely-sqljs.dialect.js')

    const SQL = await initSqlJs()
    const rawDb = new SQL.Database()

    rawDb.run('PRAGMA foreign_keys = ON')

    rawDb.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        google_sub TEXT UNIQUE,
        perfil TEXT NOT NULL DEFAULT 'editor' CHECK(perfil IN ('admin','editor','visualizador')),
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        ultimo_login TEXT,
        ultimo_ip TEXT
      );

      CREATE TABLE IF NOT EXISTS registros_mensais (
        id TEXT PRIMARY KEY,
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
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(ano, mes)
      );

      CREATE TABLE IF NOT EXISTS pacientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        data_nascimento TEXT,
        convenio TEXT NOT NULL CHECK(convenio IN ('Camperj','Unimed')),
        modalidade TEXT NOT NULL CHECK(modalidade IN ('AD','ID')),
        observacoes TEXT,
        ativo INTEGER NOT NULL DEFAULT 1,
        motivo_desativacao TEXT,
        indicador_desativacao TEXT,
        criado_por TEXT,
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS eventos_pacientes (
        id TEXT PRIMARY KEY,
        paciente_id TEXT NOT NULL REFERENCES pacientes(id),
        registro_id TEXT REFERENCES registros_mensais(id),
        ano INTEGER,
        mes INTEGER,
        tipo_evento TEXT NOT NULL,
        subtipo TEXT,
        data_evento TEXT,
        observacao_texto TEXT,
        documentacao_url TEXT,
        descricao TEXT,
        registrado_por TEXT,
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS metas (
        id TEXT PRIMARY KEY,
        indicador_codigo TEXT NOT NULL,
        ano INTEGER NOT NULL,
        mes_inicio INTEGER NOT NULL DEFAULT 1,
        mes_fim INTEGER NOT NULL DEFAULT 12,
        meta_valor REAL,
        limite_alerta REAL,
        sentido TEXT NOT NULL DEFAULT 'menor' CHECK(sentido IN ('maior','menor','neutro')),
        atualizado_por TEXT,
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(indicador_codigo, ano, mes_inicio, mes_fim)
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        entidade TEXT NOT NULL,
        entidade_id TEXT NOT NULL,
        acao TEXT NOT NULL CHECK(acao IN ('criar','editar','confirmar','excluir','reverter','reverter_criacao','reverter_exclusao','reverter_edicao','reverter_confirmacao','desativar','reativar')),
        campo_alterado TEXT,
        valor_anterior TEXT,
        valor_novo TEXT,
        usuario_id TEXT,
        usuario_email TEXT,
        ip TEXT,
        user_agent TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        justificativa TEXT,
        documentacao_url TEXT,
        payload TEXT,
        revertido INTEGER NOT NULL DEFAULT 0,
        revertido_por TEXT,
        reverte_ref TEXT,
        FOREIGN KEY (revertido_por) REFERENCES audit_log(id),
        FOREIGN KEY (reverte_ref) REFERENCES audit_log(id)
      );
    `)

    db = new Kysely<Database>({ dialect: new SqlJsDialect(rawDb) })

    logger.info('Database SQLite in-memory inicializado (sql.js + Kysely)')
  }
}

/** Kysely instance — use for all queries */
export function getKysely(): Kysely<Database> {
  if (!db) throw new Error('Database não inicializado. Chame initializeDatabase() primeiro.')
  return db
}

/** Whether running PostgreSQL (production) */
export function isProduction(): boolean {
  return isPostgres
}

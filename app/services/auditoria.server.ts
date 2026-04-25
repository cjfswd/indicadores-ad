/**
 * Auditoria Service — server-only.
 */
import { getKysely } from "./db.server"

export interface AuditFilters {
  entidade?: string
  acao?: string
  entidade_id?: string
  limite?: number
  offset?: number
}

export async function listarAuditLogs(filters: AuditFilters = {}) {
  const db = getKysely()
  let query = db.selectFrom("audit_log").selectAll()

  if (filters.entidade) query = query.where("entidade", "=", filters.entidade)
  if (filters.acao) query = query.where("acao", "=", filters.acao)
  if (filters.entidade_id) query = query.where("entidade_id", "=", filters.entidade_id)

  const total = await query
    .select(db.fn.countAll().as("count"))
    .executeTakeFirst()

  const limite = filters.limite ?? 100
  const offset = filters.offset ?? 0

  const logs = await db.selectFrom("audit_log").selectAll()
    .orderBy("timestamp", "desc")
    .$if(!!filters.entidade, (q) => q.where("entidade", "=", filters.entidade!))
    .$if(!!filters.acao, (q) => q.where("acao", "=", filters.acao!))
    .$if(!!filters.entidade_id, (q) => q.where("entidade_id", "=", filters.entidade_id!))
    .limit(limite)
    .offset(offset)
    .execute()

  return { logs, total: Number(total?.count ?? 0), limite, offset }
}

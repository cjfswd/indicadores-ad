import { sql, type RawBuilder } from 'kysely'

/**
 * Returns the SQL expression for "current timestamp".
 * Now always PostgreSQL — no more dual-dialect branching.
 */
export function now(): RawBuilder<string> {
  return sql<string>`NOW()`
}

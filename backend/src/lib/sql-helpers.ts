import { sql, type RawBuilder } from 'kysely'
import { isProduction } from '../config/database.js'

/**
 * Returns the SQL expression for "current timestamp" compatible with both
 * SQLite (datetime('now')) and PostgreSQL (NOW()).
 */
export function now(): RawBuilder<string> {
  return isProduction()
    ? sql<string>`NOW()`
    : sql<string>`datetime('now')`
}

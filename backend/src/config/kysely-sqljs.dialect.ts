import type { Database as SqlJsDatabase } from 'sql.js'
import {
  type DatabaseConnection,
  type DatabaseIntrospector,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type QueryCompiler,
  type QueryResult,
  type CompiledQuery,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type Kysely,
} from 'kysely'

/**
 * Kysely connection backed by a sql.js in-memory Database.
 *
 * Problem solved: Bridge Pattern — decouples Kysely's query compilation
 * from sql.js's statement execution, letting both evolve independently.
 */
class SqlJsConnection implements DatabaseConnection {
  constructor(private readonly db: SqlJsDatabase) {}

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery
    const params = parameters as (string | number | null | Uint8Array)[]

    // DML: INSERT / UPDATE / DELETE / BEGIN / COMMIT / ROLLBACK
    if (/^\s*(INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)/i.test(sql)) {
      this.db.run(sql, params)
      const [result] = this.db.exec('SELECT changes() as c, last_insert_rowid() as r')
      const numAffectedRows = BigInt(result.values[0][0] as number)
      return { rows: [] as R[], numAffectedRows }
    }

    // DQL: SELECT / PRAGMA
    const stmt = this.db.prepare(sql)
    stmt.bind(params)

    const rows: R[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as R)
    }
    stmt.free()

    return { rows }
  }

  // sql.js is synchronous — streaming not applicable
  async *streamQuery<R>(_compiledQuery: CompiledQuery): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('sql.js dialect does not support streaming')
  }
}

class SqlJsDriver implements Driver {
  constructor(private readonly db: SqlJsDatabase) {}

  async init(): Promise<void> { /* sql.js already initialized */ }
  async destroy(): Promise<void> { /* in-memory — nothing to close */ }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new SqlJsConnection(this.db)
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({ sql: 'BEGIN', parameters: [] } as unknown as CompiledQuery)
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({ sql: 'COMMIT', parameters: [] } as unknown as CompiledQuery)
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({ sql: 'ROLLBACK', parameters: [] } as unknown as CompiledQuery)
  }

  async releaseConnection(): Promise<void> { /* single connection — nothing to release */ }
}

export class SqlJsDialect implements Dialect {
  constructor(private readonly db: SqlJsDatabase) {}

  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }

  createDriver(): Driver {
    return new SqlJsDriver(this.db)
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }

  createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
    return new SqliteIntrospector(db)
  }
}

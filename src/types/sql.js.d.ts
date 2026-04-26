declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: unknown[]): void
    exec(sql: string, params?: unknown[]): { columns: string[]; values: unknown[][] }[]
    prepare(sql: string): Statement
    close(): void
  }

  interface Statement {
    bind(params?: unknown[]): void
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): void
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database
  }

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>
  export type { Database, Statement, SqlJsStatic }
}

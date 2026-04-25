/**
 * Database access — server-only module.
 * Used by loaders, actions, and Express API routes.
 */
export { getKysely, initializeDatabase, isProduction } from "~/server/config/database.js"
export { now } from "~/server/lib/sql-helpers.js"
export type { Database } from "~/server/config/db.schema.js"

import { app } from '../app.js'
import { initializeDatabase } from '../config/database.js'
import { seedDatabase } from '../config/seed.js'

/**
 * Inicializa o banco in-memory e seed antes de cada suite.
 * O app exportado já inclui todos os routers.
 */
export async function setupTestApp() {
  await initializeDatabase()
  await seedDatabase()
  return app
}

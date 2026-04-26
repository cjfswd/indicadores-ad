import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './app.js'
import { logger as appLogger } from './lib/logger.js'
import { initializeDatabase } from './config/database.js'
import { seedDatabase } from './config/seed.js'

const PORT = Number(process.env.PORT ?? 3001)

async function bootstrap() {
  await initializeDatabase()
  await seedDatabase()

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    appLogger.info(`Hono + HTMX rodando em http://localhost:${info.port}`)
    appLogger.info(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
  })
}

bootstrap().catch((err) => {
  appLogger.error('Falha ao iniciar servidor:', err)
  process.exit(1)
})

import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import ejsLayouts from 'express-ejs-layouts'
import { requestLogger } from './middleware/logger.middleware.js'
import { softAuth } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/error-handler.middleware.js'
import { logger } from './lib/logger.js'
import { initializeDatabase } from './config/database.js'
import { seedDatabase } from './config/seed.js'
import { registrosRouter, pacientesRouter, metasRouter, semaforoRouter, auditoriaRouter, eventosRouter, relatorioRouter, authRouter } from './routes/index.js'
import { dashboardViewRouter, registrosViewRouter, pacientesViewRouter, metasViewRouter, auditoriaViewRouter, authViewRouter } from './view-routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// ─── View Engine (EJS) ───
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.set('layout', 'layouts/main')
app.use(ejsLayouts)

// ─── Static Files ───
app.use(express.static(path.join(__dirname, '..', 'public')))

// ─── Segurança ───
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}))
app.use(cors({ origin: true, credentials: true }))

// ─── Parsing ───
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Logging ───
app.use(requestLogger)

// ─── Auth (soft — attach user if token present) ───
app.use(softAuth)

// ─── Health Check ───
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '3.0.0-htmx',
    timestamp: new Date().toISOString(),
  })
})

// ─── API Routes (JSON) ───
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/registros', registrosRouter)
app.use('/api/v1/pacientes', pacientesRouter)
app.use('/api/v1/metas', metasRouter)
app.use('/api/v1/semaforo', semaforoRouter)
app.use('/api/v1/auditoria', auditoriaRouter)
app.use('/api/v1/eventos', eventosRouter)
app.use('/api/v1/relatorio', relatorioRouter)

// ─── View Routes (HTMX — HTML) ───
app.use('/', authViewRouter)
app.use('/dashboard', dashboardViewRouter)
app.use('/registros', registrosViewRouter)
app.use('/pacientes', pacientesViewRouter)
app.use('/metas', metasViewRouter)
app.use('/auditoria', auditoriaViewRouter)

// ─── Root redirect ───
app.get('/', (_req, res) => res.redirect('/dashboard'))

// ─── Arquivos (uploads) ───
app.use('/uploads', express.static('uploads'))

// ─── Error Handler (sempre último) ───
app.use(errorHandler)

// ─── Start ───
async function bootstrap() {
  await initializeDatabase()
  await seedDatabase()

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      logger.info(`API + HTMX rodando em http://localhost:${PORT}`)
      logger.info(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
    })
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    logger.error('Falha ao iniciar servidor:', err)
    process.exit(1)
  })
}

export { app }

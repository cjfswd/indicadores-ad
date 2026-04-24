import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestLogger } from './middleware/logger.middleware.js'
import { softAuth } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/error-handler.middleware.js'
import { logger } from './lib/logger.js'
import { initializeDatabase } from './config/database.js'
import { seedDatabase } from './config/seed.js'
import { registrosRouter, pacientesRouter, metasRouter, semaforoRouter, auditoriaRouter, eventosRouter, relatorioRouter, authRouter } from './routes/index.js'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// ─── Segurança ───
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))

// ─── Parsing ───
app.use(express.json({ limit: '1mb' }))

// ─── Logging ───
app.use(requestLogger)

// ─── Auth (soft — attach user if token present) ───
app.use(softAuth)

// ─── Health Check ───
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ─── Rotas ───
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/registros', registrosRouter)
app.use('/api/v1/pacientes', pacientesRouter)
app.use('/api/v1/metas', metasRouter)
app.use('/api/v1/semaforo', semaforoRouter)
app.use('/api/v1/auditoria', auditoriaRouter)
app.use('/api/v1/eventos', eventosRouter)
app.use('/api/v1/relatorio', relatorioRouter)

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
      logger.info(`API rodando em http://localhost:${PORT}`)
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

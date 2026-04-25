import "express-async-errors"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { createRequestHandler } from "@react-router/express"
import { initializeDatabase } from "./config/database.js"
import { seedDatabase } from "./config/seed.js"
import { requestLogger } from "./middleware/logger.middleware.js"
import { softAuth } from "./middleware/auth.middleware.js"
import { errorHandler } from "./middleware/error-handler.middleware.js"
import { logger } from "./lib/logger.js"
import {
  registrosRouter, pacientesRouter, metasRouter,
  semaforoRouter, auditoriaRouter, eventosRouter,
  relatorioRouter, authRouter,
} from "./routes/index.js"

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// ─── Segurança ───
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}))
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? true : true,
  credentials: true,
}))

// ─── Parsing ───
app.use(express.json({ limit: "1mb" }))

// ─── Logging ───
app.use(requestLogger)

// ─── Auth (soft — attach user if token present) ───
app.use(softAuth)

// ─── Health Check ───
app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    version: "4.0.0",
    timestamp: new Date().toISOString(),
  })
})

// ─── API Routes ───
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/registros", registrosRouter)
app.use("/api/v1/pacientes", pacientesRouter)
app.use("/api/v1/metas", metasRouter)
app.use("/api/v1/semaforo", semaforoRouter)
app.use("/api/v1/auditoria", auditoriaRouter)
app.use("/api/v1/eventos", eventosRouter)
app.use("/api/v1/relatorio", relatorioRouter)

// ─── Uploads ───
app.use("/uploads", express.static("uploads"))

// ─── React Router Handler (todas as rotas não-API) ───
app.all(
  "*",
  createRequestHandler({
    // @ts-expect-error — virtual module resolve
    build: () => import("virtual:react-router/server-build"),
  }),
)

// ─── Error Handler ───
app.use(errorHandler)

// ─── Bootstrap ───
async function bootstrap() {
  await initializeDatabase()
  await seedDatabase()

  app.listen(PORT, () => {
    logger.info(`Server rodando em http://localhost:${PORT}`)
    logger.info(`Ambiente: ${process.env.NODE_ENV ?? "development"}`)
  })
}

bootstrap().catch((err) => {
  logger.error("Falha ao iniciar servidor:", err)
  process.exit(1)
})

export { app }

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { serveStatic } from '@hono/node-server/serve-static'

import { dashboardViewRoutes } from './view-routes/dashboard.view.js'
import { pacientesViewRoutes } from './view-routes/pacientes.view.js'
import { registrosViewRoutes } from './view-routes/registros.view.js'
import { metasViewRoutes } from './view-routes/metas.view.js'
import { auditoriaViewRoutes } from './view-routes/auditoria.view.js'
import { authViewRoutes } from './view-routes/auth.view.js'

const app = new Hono()

// ─── Middleware ───
app.use('*', logger())
app.use('*', cors())
app.use('*', secureHeaders())

// ─── Static Files ───
app.use('/css/*', serveStatic({ root: './public' }))
app.use('/js/*', serveStatic({ root: './public' }))
app.use('/uploads/*', serveStatic({ root: './' }))

// ─── Body size limit (via Hono built-in) ───
// Hono handles this natively with parseBody

// ─── Health Check ───
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '5.0.0-hono',
    timestamp: new Date().toISOString(),
  })
})

// ─── View Routes (HTMX — HTML) ───
app.route('/', authViewRoutes)
app.route('/dashboard', dashboardViewRoutes)
app.route('/registros', registrosViewRoutes)
app.route('/pacientes', pacientesViewRoutes)
app.route('/metas', metasViewRoutes)
app.route('/auditoria', auditoriaViewRoutes)

// ─── Root redirect ───
app.get('/', (c) => c.redirect('/dashboard'))

export default app

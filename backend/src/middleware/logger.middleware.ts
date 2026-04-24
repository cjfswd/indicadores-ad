import type { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import { logger } from '../lib/logger.js'

const MAX_BODY_KB = Number(process.env.LOG_MAX_BODY_SIZE_KB ?? 10)

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = uuid()
  const startedAt = Date.now()

  ;(req as Record<string, unknown>).requestId = requestId

  const safeBody = sanitizeBody(req.body as Record<string, unknown>)

  res.on('finish', () => {
    const log = {
      timestamp: new Date().toISOString(),
      request_id: requestId,
      method: req.method,
      route: req.route?.path ?? req.path,
      url: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt,
      usuario_id: (req as Record<string, unknown>).user
        ? ((req as Record<string, unknown>).user as Record<string, string>).id
        : null,
      usuario_email: (req as Record<string, unknown>).user
        ? ((req as Record<string, unknown>).user as Record<string, string>).email
        : null,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
      body: safeBody,
      query_params: req.query,
    }

    if (res.statusCode >= 500) logger.error(log)
    else if (res.statusCode >= 400) logger.warn(log)
    else logger.info(log)
  })

  next()
}

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const OMIT = ['senha', 'password', 'token', 'secret', 'idToken']
  const safe = { ...body }
  for (const k of OMIT) {
    if (k in safe) safe[k] = '[OMITIDO]'
  }

  const serialized = JSON.stringify(safe)
  if (serialized.length > MAX_BODY_KB * 1024) {
    return { _truncated: true, _size_kb: Math.round(serialized.length / 1024) }
  }

  return safe
}

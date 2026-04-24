import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-fallback-secret'

interface SessionPayload {
  userId: string
  perfil: string
  email: string
}

/**
 * Soft auth: attaches user to request if valid token present.
 * Does NOT reject unauthenticated requests — use for audit logging.
 */
export function softAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), SESSION_SECRET) as SessionPayload
      ;(req as unknown as Record<string, unknown>).user = {
        id: payload.userId,
        perfil: payload.perfil,
        email: payload.email,
      }
    } catch {
      // Token invalid/expired — continue without user
    }
  }
  next()
}

/**
 * Hard auth: rejects unauthenticated requests with 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nao autenticado' })
    return
  }

  try {
    const payload = jwt.verify(header.slice(7), SESSION_SECRET) as SessionPayload
    ;(req as unknown as Record<string, unknown>).user = {
      id: payload.userId,
      perfil: payload.perfil,
      email: payload.email,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Token expirado' })
  }
}

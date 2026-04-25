import type { Request } from 'express'

interface RequestUser {
  id: string
  email: string
  perfil: string
}

/**
 * Extracts the authenticated user from the request.
 * Returns null if no user is attached (unauthenticated request).
 */
export function getRequestUser(req: Request): RequestUser | null {
  const user = (req as unknown as Record<string, unknown>).user as RequestUser | undefined
  return user ?? null
}

/** Shorthand to get just the email for audit logging */
export function getRequestEmail(req: Request): string | null {
  return getRequestUser(req)?.email ?? null
}

interface RequestUser {
  id: string
  email: string
  perfil: string
}

/**
 * Extracts the authenticated user from a Hono context's custom properties.
 * Returns null if no user is attached (unauthenticated request).
 */
export function getRequestUser(c: { get?: (key: string) => unknown }): RequestUser | null {
  const user = c.get?.('user') as RequestUser | undefined
  return user ?? null
}

/** Shorthand to get just the email for audit logging */
export function getRequestEmail(c: { get?: (key: string) => unknown }): string | null {
  return getRequestUser(c)?.email ?? null
}

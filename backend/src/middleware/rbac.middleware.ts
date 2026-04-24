import type { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../errors/app-error.js'
import type { Perfil } from '@indicadores/shared'

export function requirePerfil(...perfisPermitidos: Perfil[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as Record<string, unknown>).user as { perfil: string } | undefined
    if (!user) {
      throw new ForbiddenError('Usuário não autenticado')
    }

    if (!perfisPermitidos.includes(user.perfil as Perfil)) {
      throw new ForbiddenError(
        `Perfil '${user.perfil}' não tem permissão. Requerido: ${perfisPermitidos.join(', ')}`,
      )
    }

    next()
  }
}

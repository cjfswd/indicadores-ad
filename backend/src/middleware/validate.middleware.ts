import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message,
            codigo: e.code,
          })),
        })
        return
      }
      next(error)
    }
  }
}

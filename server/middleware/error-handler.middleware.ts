import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/app-error.js'
import { logger } from '../lib/logger.js'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    logger.warn({
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId: (req as unknown as Record<string, unknown>).requestId,
    })

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    })
    return
  }

  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: (req as unknown as Record<string, unknown>).requestId,
  })

  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

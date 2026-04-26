/** Erro base — todas as exceções do sistema estendem desta */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 422, details)
  }
}

export class NotFoundError extends AppError {
  constructor(entidade: string, id: string) {
    super(`${entidade} não encontrado: ${id}`, 'NOT_FOUND', 404)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Token inválido ou expirado') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 400)
  }
}

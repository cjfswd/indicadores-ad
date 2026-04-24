import { AppError, ValidationError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError, BusinessRuleError } from '../errors/app-error.js'

describe('AppError hierarchy', () => {
  it('AppError deve ter message, code e statusCode', () => {
    const err = new AppError('teste', 'TEST', 500)
    expect(err.message).toBe('teste')
    expect(err.code).toBe('TEST')
    expect(err.statusCode).toBe(500)
    expect(err.name).toBe('AppError')
    expect(err).toBeInstanceOf(Error)
  })

  it('AppError deve aceitar details opcionais', () => {
    const err = new AppError('teste', 'TEST', 500, { campo: 'valor' })
    expect(err.details).toEqual({ campo: 'valor' })
  })

  it('ValidationError deve ter statusCode 422', () => {
    const err = new ValidationError('campo inválido')
    expect(err.statusCode).toBe(422)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.name).toBe('ValidationError')
  })

  it('NotFoundError deve ter statusCode 404 e formatação correta', () => {
    const err = new NotFoundError('Paciente', 'abc-123')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('Paciente não encontrado: abc-123')
  })

  it('ForbiddenError deve ter statusCode 403', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
    expect(err.message).toBe('Acesso negado')
  })

  it('ForbiddenError deve aceitar mensagem customizada', () => {
    const err = new ForbiddenError('Sem permissão')
    expect(err.message).toBe('Sem permissão')
  })

  it('UnauthorizedError deve ter statusCode 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('ConflictError deve ter statusCode 409', () => {
    const err = new ConflictError('Já existe')
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe('CONFLICT')
  })

  it('BusinessRuleError deve ter statusCode 400', () => {
    const err = new BusinessRuleError('Regra violada')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('BUSINESS_RULE_VIOLATION')
  })

  it('Todas devem ser instância de AppError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(AppError)
    expect(new NotFoundError('x', 'y')).toBeInstanceOf(AppError)
    expect(new ForbiddenError()).toBeInstanceOf(AppError)
    expect(new UnauthorizedError()).toBeInstanceOf(AppError)
    expect(new ConflictError('x')).toBeInstanceOf(AppError)
    expect(new BusinessRuleError('x')).toBeInstanceOf(AppError)
  })
})

describe('Health Check', () => {
  let app: import('express').Express

  beforeAll(async () => {
    const { setupTestApp } = await import('./setup.js')
    app = await setupTestApp()
  })

  it('GET /api/v1/health deve retornar status ok', async () => {
    const supertest = await import('supertest')
    const request = supertest.default
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body).toHaveProperty('uptime')
    expect(res.body).toHaveProperty('version')
    expect(res.body).toHaveProperty('timestamp')
  })
})

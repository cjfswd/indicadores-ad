import request from 'supertest'
import type { Express } from 'express'
import { setupTestApp } from './setup.js'

let app: Express

beforeAll(async () => {
  app = await setupTestApp()
})

describe('GET /api/v1/registros', () => {
  it('deve retornar registros mensais com dados e ano', async () => {
    const res = await request(app).get('/api/v1/registros')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('dados')
    expect(res.body).toHaveProperty('ano')
    expect(Array.isArray(res.body.dados)).toBe(true)
    expect(res.body.dados.length).toBeGreaterThan(0)
  })

  it('deve filtrar por ano', async () => {
    const res = await request(app).get('/api/v1/registros?ano=2026')
    expect(res.status).toBe(200)
    for (const reg of res.body.dados) {
      expect(reg.ano).toBe(2026)
    }
  })
})

describe('POST /api/v1/registros', () => {
  it('deve criar registro mensal com audit payload', async () => {
    const payload = {
      ano: 2026,
      mes: 6,
      taxa_altas_pct: 85.5,
      intercorrencias_total: 12,
      pacientes_total: 50,
    }
    const res = await request(app).post('/api/v1/registros').send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.ano).toBe(2026)
    expect(res.body.mes).toBe(6)

    // Verificar audit
    const auditRes = await request(app).get('/api/v1/auditoria?entidade=registro_mensal&acao=criar')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === res.body.id)
    expect(entry).toBeDefined()
    expect(entry.payload).toBeTruthy()
    const parsed = JSON.parse(entry.payload)
    expect(parsed.ano).toBe(2026)
    expect(parsed.mes).toBe(6)
  })
})

describe('PUT /api/v1/registros/:id', () => {
  it('deve editar registro e gerar audit com antes/depois', async () => {
    const listRes = await request(app).get('/api/v1/registros')
    const reg = listRes.body.dados[0]

    const res = await request(app)
      .put(`/api/v1/registros/${reg.id}`)
      .send({ taxa_altas_pct: 90.0, pacientes_total: 60 })
    expect(res.status).toBe(200)
    expect(res.body.taxa_altas_pct).toBe(90.0)

    const auditRes = await request(app).get('/api/v1/auditoria?entidade=registro_mensal&acao=editar')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === reg.id)
    expect(entry).toBeDefined()
    const parsed = JSON.parse(entry.payload)
    expect(parsed).toHaveProperty('antes')
    expect(parsed).toHaveProperty('depois')
  })

  it('deve retornar 404 para id inexistente', async () => {
    const res = await request(app).put('/api/v1/registros/fake-id').send({ taxa_altas_pct: 50 })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/v1/registros/:id/confirmar', () => {
  it('deve confirmar registro e gerar audit', async () => {
    // Criar um novo para confirmar
    const createRes = await request(app).post('/api/v1/registros').send({ ano: 2026, mes: 7, pacientes_total: 30 })
    const id = createRes.body.id
    expect(createRes.body.status).toBe('rascunho')

    const res = await request(app).put(`/api/v1/registros/${id}/confirmar`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('confirmado')

    const auditRes = await request(app).get('/api/v1/auditoria?entidade=registro_mensal&acao=confirmar')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === id)
    expect(entry).toBeDefined()
    const parsed = JSON.parse(entry.payload)
    expect(parsed.antes.status).toBe('rascunho')
    expect(parsed.depois.status).toBe('confirmado')
  })
})

describe('PATCH /api/v1/registros/:id', () => {
  it('deve atualizar campos parcialmente', async () => {
    const listRes = await request(app).get('/api/v1/registros')
    const reg = listRes.body.dados[0]

    const res = await request(app)
      .patch(`/api/v1/registros/${reg.id}`)
      .send({ obitos_total: 3 })
    expect(res.status).toBe(200)
    expect(res.body.obitos_total).toBe(3)
  })
})

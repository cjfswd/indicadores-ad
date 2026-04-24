import request from 'supertest'
import type { Express } from 'express'
import { setupTestApp } from './setup.js'

let app: Express

beforeAll(async () => {
  app = await setupTestApp()
})

describe('GET /api/v1/metas', () => {
  it('deve retornar metas do ano atual', async () => {
    const res = await request(app).get('/api/v1/metas')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('dados')
    expect(Array.isArray(res.body.dados)).toBe(true)
    expect(res.body.dados.length).toBeGreaterThan(0)
  })

  it('deve filtrar por ano', async () => {
    const res = await request(app).get('/api/v1/metas?ano=2026')
    expect(res.status).toBe(200)
    for (const meta of res.body.dados) {
      expect(meta.ano).toBe(2026)
    }
  })
})

describe('PUT /api/v1/metas', () => {
  it('deve atualizar meta existente e gerar audit', async () => {
    const payload = [
      { indicador_codigo: 'IND-001', ano: 2026, meta_valor: 99, limite_alerta: 95, sentido: 'menor' },
    ]
    const res = await request(app).put('/api/v1/metas').send(payload)
    expect(res.status).toBe(200)

    const meta = res.body.dados.find((m: Record<string, unknown>) => m.indicador_codigo === 'IND-001')
    expect(meta).toBeDefined()
    expect(meta.meta_valor).toBe(99)
  })

  it('deve gerar audit com antes/depois quando valor muda', async () => {
    // Primeira definição
    await request(app).put('/api/v1/metas').send([
      { indicador_codigo: 'IND-TEST', ano: 2026, meta_valor: 50, limite_alerta: 40, sentido: 'menor' },
    ])

    // Alterar valor
    await request(app).put('/api/v1/metas').send([
      { indicador_codigo: 'IND-TEST', ano: 2026, meta_valor: 70, limite_alerta: 60, sentido: 'menor' },
    ])

    const auditRes = await request(app).get('/api/v1/auditoria?entidade=meta&acao=editar')
    const entry = auditRes.body.dados.find(
      (e: Record<string, unknown>) => e.entidade_id === 'IND-TEST',
    )
    expect(entry).toBeDefined()
    const parsed = JSON.parse(entry.payload)
    expect(parsed).toHaveProperty('antes')
    expect(parsed).toHaveProperty('depois')
  })

  it('NÃO deve gerar audit quando valor não muda', async () => {
    // Definir
    await request(app).put('/api/v1/metas').send([
      { indicador_codigo: 'IND-SAME', ano: 2026, meta_valor: 80, limite_alerta: 70, sentido: 'menor' },
    ])

    // Enviar o mesmo valor
    await request(app).put('/api/v1/metas').send([
      { indicador_codigo: 'IND-SAME', ano: 2026, meta_valor: 80, limite_alerta: 70, sentido: 'menor' },
    ])

    const auditRes = await request(app).get('/api/v1/auditoria?entidade=meta')
    const entries = auditRes.body.dados.filter(
      (e: Record<string, unknown>) => e.entidade_id === 'IND-SAME',
    )
    // Deve ter apenas 1 entrada (a criação), não 2
    expect(entries.length).toBe(1)
  })
})

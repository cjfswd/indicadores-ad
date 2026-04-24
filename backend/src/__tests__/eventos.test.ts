import request from 'supertest'
import type { Express } from 'express'
import { setupTestApp } from './setup.js'

let app: Express

beforeAll(async () => {
  app = await setupTestApp()
})

describe('GET /api/v1/eventos', () => {
  it('deve retornar lista de eventos', async () => {
    const res = await request(app).get('/api/v1/eventos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.dados)).toBe(true)
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('deve incluir dados do paciente no join', async () => {
    const res = await request(app).get('/api/v1/eventos')
    const evento = res.body.dados[0]
    expect(evento).toHaveProperty('paciente_nome')
  })

  it('deve filtrar por tipo_evento', async () => {
    const res = await request(app).get('/api/v1/eventos?tipo_evento=obito')
    expect(res.status).toBe(200)
    for (const ev of res.body.dados) {
      expect(ev.tipo_evento).toBe('obito')
    }
  })

  it('deve filtrar por ano/mes', async () => {
    const res = await request(app).get('/api/v1/eventos?ano=2026&mes=4')
    expect(res.status).toBe(200)
    for (const ev of res.body.dados) {
      expect(ev.ano).toBe(2026)
      expect(ev.mes).toBe(4)
    }
  })
})

describe('POST /api/v1/eventos', () => {
  it('deve criar evento e incrementar métrica', async () => {
    const pacRes = await request(app).get('/api/v1/pacientes')
    const pacienteId = pacRes.body.dados[0].id

    const payload = {
      paciente_id: pacienteId,
      tipo_evento: 'ea_queda',
      ano: 2026,
      mes: 4,
      descricao: 'Queda no banheiro',
    }
    const res = await request(app).post('/api/v1/eventos').send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.tipo_evento).toBe('ea_queda')
    expect(res.body.paciente_nome).toBeTruthy()
  })

  it('deve gerar audit com snapshot completo', async () => {
    const pacRes = await request(app).get('/api/v1/pacientes')
    const pacienteId = pacRes.body.dados[0].id

    const createRes = await request(app).post('/api/v1/eventos').send({
      paciente_id: pacienteId,
      tipo_evento: 'ouvidoria_elogio',
      ano: 2026,
      mes: 4,
    })
    const eventoId = createRes.body.id

    const auditRes = await request(app).get('/api/v1/auditoria?entidade=evento_paciente&acao=criar')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === eventoId)
    expect(entry).toBeDefined()
    expect(entry.payload).toBeTruthy()
    const parsed = JSON.parse(entry.payload)
    expect(parsed.paciente_nome).toBeTruthy()
  })

  it('deve rejeitar sem campos obrigatórios', async () => {
    const res = await request(app).post('/api/v1/eventos').send({ descricao: 'sem dados' })
    expect(res.status).toBe(400)
  })

  it('deve rejeitar paciente inexistente', async () => {
    const res = await request(app).post('/api/v1/eventos').send({
      paciente_id: 'fake-id',
      tipo_evento: 'obito',
      ano: 2026,
      mes: 4,
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/eventos/:id', () => {
  it('deve excluir evento com justificativa', async () => {
    const pacRes = await request(app).get('/api/v1/pacientes')
    const createRes = await request(app).post('/api/v1/eventos').send({
      paciente_id: pacRes.body.dados[0].id,
      tipo_evento: 'ea_lesao_pressao',
      ano: 2026,
      mes: 4,
    })
    const id = createRes.body.id

    const res = await request(app)
      .delete(`/api/v1/eventos/${id}`)
      .send({ justificativa: 'Registro duplicado' })
    expect(res.status).toBe(204)
  })

  it('deve gerar audit com snapshot completo ao excluir', async () => {
    const pacRes = await request(app).get('/api/v1/pacientes')
    const createRes = await request(app).post('/api/v1/eventos').send({
      paciente_id: pacRes.body.dados[0].id,
      tipo_evento: 'ea_broncoaspiracao',
      ano: 2026,
      mes: 4,
    })
    const id = createRes.body.id

    await request(app).delete(`/api/v1/eventos/${id}`).send({ justificativa: 'Teste' })

    const auditRes = await request(app).get('/api/v1/auditoria?entidade=evento_paciente&acao=excluir')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === id)
    expect(entry).toBeDefined()
    const parsed = JSON.parse(entry.payload)
    expect(parsed.antes.tipo_evento).toBe('ea_broncoaspiracao')
    expect(parsed.antes.paciente_nome).toBeTruthy()
  })
})

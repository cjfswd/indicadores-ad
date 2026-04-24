import request from 'supertest'
import type { Express } from 'express'
import { setupTestApp } from './setup.js'

let app: Express

beforeAll(async () => {
  app = await setupTestApp()
})

describe('GET /api/v1/pacientes', () => {
  it('deve retornar lista de pacientes com total', async () => {
    const res = await request(app).get('/api/v1/pacientes')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('dados')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.dados)).toBe(true)
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('deve agrupar por convênio', async () => {
    const res = await request(app).get('/api/v1/pacientes')
    expect(res.body).toHaveProperty('agrupado')
    expect(typeof res.body.agrupado).toBe('object')
  })

  it('deve filtrar por convênio', async () => {
    const res = await request(app).get('/api/v1/pacientes?convenio=Camperj')
    expect(res.status).toBe(200)
    for (const pac of res.body.dados) {
      expect(pac.convenio).toBe('Camperj')
    }
  })

  it('deve filtrar por ativo', async () => {
    const res = await request(app).get('/api/v1/pacientes?ativo=true')
    expect(res.status).toBe(200)
    for (const pac of res.body.dados) {
      expect(pac.ativo).toBe(1)
    }
  })

  it('deve filtrar por busca no nome', async () => {
    const res = await request(app).get('/api/v1/pacientes?busca=Ana')
    expect(res.status).toBe(200)
    for (const pac of res.body.dados) {
      expect(pac.nome.toLowerCase()).toContain('ana')
    }
  })
})

describe('GET /api/v1/pacientes/convenios', () => {
  it('deve retornar array de convênios únicos', async () => {
    const res = await request(app).get('/api/v1/pacientes/convenios')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toContain('Camperj')
  })
})

describe('POST /api/v1/pacientes', () => {
  it('deve criar paciente com dados válidos', async () => {
    const payload = { nome: 'Teste Unitário', convenio: 'Camperj', modalidade: 'AD' }
    const res = await request(app).post('/api/v1/pacientes').send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.nome).toBe('Teste Unitário')
    expect(res.body.convenio).toBe('Camperj')
    expect(res.body.ativo).toBe(1)
  })

  it('deve criar paciente com todos os campos opcionais', async () => {
    const payload = {
      nome: 'Paciente Completo',
      convenio: 'Unimed',
      modalidade: 'ID',
      data_nascimento: '1990-05-15',
      observacoes: 'Paciente de teste',
    }
    const res = await request(app).post('/api/v1/pacientes').send(payload)
    expect(res.status).toBe(201)
    expect(res.body.data_nascimento).toBe('1990-05-15')
    expect(res.body.observacoes).toBe('Paciente de teste')
  })

  it('deve gerar audit_log com payload ao criar', async () => {
    const payload = { nome: 'Audit Test', convenio: 'Camperj', modalidade: 'AD' }
    const createRes = await request(app).post('/api/v1/pacientes').send(payload)
    const id = createRes.body.id

    const auditRes = await request(app).get(`/api/v1/auditoria?entidade=paciente&acao=criar`)
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === id)
    expect(entry).toBeDefined()
    expect(entry.payload).toBeTruthy()
    const parsedPayload = JSON.parse(entry.payload)
    expect(parsedPayload.nome).toBe('Audit Test')
  })

  it('deve rejeitar nome com menos de 3 caracteres', async () => {
    const res = await request(app).post('/api/v1/pacientes').send({ nome: 'AB', convenio: 'Camperj', modalidade: 'AD' })
    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty('error')
  })

  it('deve rejeitar convênio inválido', async () => {
    const res = await request(app).post('/api/v1/pacientes').send({ nome: 'Teste', convenio: 'Invalido', modalidade: 'AD' })
    expect(res.status).toBe(422)
  })

  it('deve rejeitar modalidade inválida', async () => {
    const res = await request(app).post('/api/v1/pacientes').send({ nome: 'Teste', convenio: 'Camperj', modalidade: 'XX' })
    expect(res.status).toBe(422)
  })
})

describe('GET /api/v1/pacientes/:id', () => {
  it('deve retornar paciente pelo id', async () => {
    const listRes = await request(app).get('/api/v1/pacientes')
    const id = listRes.body.dados[0].id

    const res = await request(app).get(`/api/v1/pacientes/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(id)
  })

  it('deve retornar 404 para id inexistente', async () => {
    const res = await request(app).get('/api/v1/pacientes/inexistente-id')
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/v1/pacientes/:id', () => {
  it('deve editar paciente e gerar audit com antes/depois', async () => {
    const listRes = await request(app).get('/api/v1/pacientes')
    const pac = listRes.body.dados[0]

    const payload = { nome: 'Nome Editado', convenio: pac.convenio, modalidade: pac.modalidade }
    const res = await request(app).put(`/api/v1/pacientes/${pac.id}`).send(payload)
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe('Nome Editado')

    // Verificar audit payload tem antes/depois
    const auditRes = await request(app).get(`/api/v1/auditoria?entidade=paciente&acao=editar`)
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === pac.id)
    expect(entry).toBeDefined()
    expect(entry.payload).toBeTruthy()
    const parsed = JSON.parse(entry.payload)
    expect(parsed).toHaveProperty('antes')
    expect(parsed).toHaveProperty('depois')
    expect(parsed.depois.nome).toBe('Nome Editado')
  })

  it('deve retornar 404 para id inexistente', async () => {
    const res = await request(app)
      .put('/api/v1/pacientes/fake-id')
      .send({ nome: 'Teste', convenio: 'Camperj', modalidade: 'AD' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/pacientes/:id/ativo', () => {
  it('deve toggle ativo e gerar audit com antes/depois', async () => {
    const listRes = await request(app).get('/api/v1/pacientes')
    const pac = listRes.body.dados.find((p: Record<string, unknown>) => p.ativo === 1)

    const res = await request(app).patch(`/api/v1/pacientes/${pac.id}/ativo`).send({})
    expect(res.status).toBe(200)
    expect(res.body.ativo).toBe(0)

    // Verificar audit
    const auditRes = await request(app).get(`/api/v1/auditoria?entidade=paciente&por_pagina=50`)
    const entry = auditRes.body.dados.find(
      (e: Record<string, unknown>) => e.entidade_id === pac.id && e.valor_anterior === 'ativo=1',
    )
    expect(entry).toBeDefined()
    expect(entry.payload).toBeTruthy()
    const parsed = JSON.parse(entry.payload)
    expect(parsed.antes.ativo).toBe(1)
    expect(parsed.depois.ativo).toBe(0)

    // Toggle back
    const res2 = await request(app).patch(`/api/v1/pacientes/${pac.id}/ativo`).send({})
    expect(res2.body.ativo).toBe(1)
  })
})

describe('DELETE /api/v1/pacientes/:id', () => {
  it('deve exigir justificativa', async () => {
    const createRes = await request(app)
      .post('/api/v1/pacientes')
      .send({ nome: 'Para Deletar', convenio: 'Camperj', modalidade: 'AD' })
    const id = createRes.body.id

    const res = await request(app).delete(`/api/v1/pacientes/${id}`).send({})
    expect(res.status).toBe(400)
  })

  it('deve deletar com justificativa e gerar audit com payload completo', async () => {
    const createRes = await request(app)
      .post('/api/v1/pacientes')
      .send({ nome: 'Para Deletar 2', convenio: 'Unimed', modalidade: 'ID' })
    const id = createRes.body.id

    const res = await request(app)
      .delete(`/api/v1/pacientes/${id}`)
      .send({ justificativa: 'Teste de exclusão' })
    expect(res.status).toBe(204)

    // Verificar que sumiu
    const getRes = await request(app).get(`/api/v1/pacientes/${id}`)
    expect(getRes.status).toBe(404)

    // Verificar audit payload tem dados completos do paciente
    const auditRes = await request(app).get(`/api/v1/auditoria?entidade=paciente&acao=excluir`)
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === id)
    expect(entry).toBeDefined()
    const parsed = JSON.parse(entry.payload)
    expect(parsed.antes.nome).toBe('Para Deletar 2')
    expect(parsed.antes.convenio).toBe('Unimed')
  })
})

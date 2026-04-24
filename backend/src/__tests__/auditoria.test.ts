import request from 'supertest'
import type { Express } from 'express'
import { setupTestApp } from './setup.js'

let app: Express

beforeAll(async () => {
  app = await setupTestApp()
})

describe('GET /api/v1/auditoria', () => {
  it('deve retornar lista paginada', async () => {
    const res = await request(app).get('/api/v1/auditoria')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('dados')
    expect(res.body).toHaveProperty('paginacao')
    expect(res.body.paginacao).toHaveProperty('total_registros')
    expect(res.body.paginacao).toHaveProperty('pagina_atual')
    expect(res.body.paginacao).toHaveProperty('total_paginas')
    expect(Array.isArray(res.body.dados)).toBe(true)
  })

  it('deve paginar corretamente', async () => {
    const res = await request(app).get('/api/v1/auditoria?por_pagina=2&pagina=1')
    expect(res.body.dados.length).toBeLessThanOrEqual(2)
  })

  it('deve filtrar por entidade', async () => {
    const res = await request(app).get('/api/v1/auditoria?entidade=evento_paciente')
    for (const entry of res.body.dados) {
      expect(entry.entidade).toBe('evento_paciente')
    }
  })

  it('deve filtrar por ação', async () => {
    const res = await request(app).get('/api/v1/auditoria?acao=criar')
    for (const entry of res.body.dados) {
      expect(entry.acao).toBe('criar')
    }
  })

  it('todas as entries do seed devem ter payload', async () => {
    const res = await request(app).get('/api/v1/auditoria?por_pagina=50')
    for (const entry of res.body.dados) {
      expect(entry.payload).toBeTruthy()
    }
  })
})

describe('POST /api/v1/auditoria/:id/reverter — Reversão de criação', () => {
  it('deve reverter criação de evento e gerar linking bidirecional', async () => {
    const auditRes = await request(app).get('/api/v1/auditoria?acao=criar&entidade=evento_paciente&por_pagina=1')
    const entry = auditRes.body.dados[0]
    expect(entry).toBeDefined()

    const res = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Teste reversão criação' })
    expect(res.status).toBe(200)
    expect(res.body.acao_original).toBe('criar')
    expect(res.body.reversal_id).toBeTruthy()

    // Verificar linking bidirecional
    const updatedAudit = await request(app).get('/api/v1/auditoria?por_pagina=50')
    const original = updatedAudit.body.dados.find((e: Record<string, unknown>) => e.id === entry.id)
    const reversal = updatedAudit.body.dados.find((e: Record<string, unknown>) => e.id === res.body.reversal_id)

    expect(original.revertido).toBe(1)
    expect(original.revertido_por).toBe(res.body.reversal_id)
    expect(reversal.reverte_ref).toBe(entry.id)
    expect(reversal.acao).toBe('reverter_criacao')
    expect(reversal.payload).toBeTruthy()
  })
})

describe('POST /api/v1/auditoria/:id/reverter — Proteções', () => {
  it('deve bloquear reversão dupla (409)', async () => {
    // Criar um evento para reverter
    const pacRes = await request(app).get('/api/v1/pacientes')
    const createRes = await request(app).post('/api/v1/eventos').send({
      paciente_id: pacRes.body.dados[0].id,
      tipo_evento: 'ea_queda',
      ano: 2026,
      mes: 4,
    })
    const eventoId = createRes.body.id

    // Encontrar a entrada de audit da criação
    const auditRes = await request(app).get('/api/v1/auditoria?acao=criar&entidade=evento_paciente&por_pagina=50')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === eventoId)

    // Primeira reversão — sucesso
    const res1 = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Primeira' })
    expect(res1.status).toBe(200)

    // Segunda reversão — bloqueado
    const res2 = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Duplicada' })
    expect(res2.status).toBe(409)
  })

  it('deve bloquear reversão de reversão (400)', async () => {
    // Criar evento
    const pacRes = await request(app).get('/api/v1/pacientes')
    const createRes = await request(app).post('/api/v1/eventos').send({
      paciente_id: pacRes.body.dados[0].id,
      tipo_evento: 'ea_decanulacao',
      ano: 2026,
      mes: 4,
    })
    const eventoId = createRes.body.id

    const auditRes = await request(app).get('/api/v1/auditoria?acao=criar&entidade=evento_paciente&por_pagina=50')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === eventoId)

    // Reverter
    const revertRes = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Teste' })
    const reversalId = revertRes.body.reversal_id

    // Tentar reverter a reversão
    const res = await request(app)
      .post(`/api/v1/auditoria/${reversalId}/reverter`)
      .send({ justificativa: 'Meta-reversão' })
    expect(res.status).toBe(400)
  })

  it('deve reverter confirmação de registro mensal (status → rascunho)', async () => {
    // Criar e confirmar registro
    const createRes = await request(app).post('/api/v1/registros').send({ ano: 2026, mes: 8, pacientes_total: 20 })
    const regId = createRes.body.id
    await request(app).put(`/api/v1/registros/${regId}/confirmar`)

    // Verificar que ficou confirmado
    const regRes = await request(app).get('/api/v1/registros?ano=2026')
    const confirmed = regRes.body.dados.find((r: Record<string, unknown>) => r.id === regId)
    expect(confirmed.status).toBe('confirmado')

    // Encontrar audit da confirmação
    const auditRes = await request(app).get('/api/v1/auditoria?acao=confirmar&entidade=registro_mensal&por_pagina=50')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === regId)
    expect(entry).toBeDefined()

    // Reverter confirmação
    const revertRes = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Reabrir para correção' })
    expect(revertRes.status).toBe(200)
    expect(revertRes.body.acao_original).toBe('confirmar')

    // Registro deve estar de volta como rascunho
    const regRes2 = await request(app).get('/api/v1/registros?ano=2026')
    const reverted = regRes2.body.dados.find((r: Record<string, unknown>) => r.id === regId)
    expect(reverted.status).toBe('rascunho')

    // Audit log deve ter reverter_confirmacao
    const auditRes2 = await request(app).get('/api/v1/auditoria?por_pagina=50')
    const reversalEntry = auditRes2.body.dados.find((e: Record<string, unknown>) => e.id === revertRes.body.reversal_id)
    expect(reversalEntry.acao).toBe('reverter_confirmacao')
    expect(reversalEntry.reverte_ref).toBe(entry.id)
  })

  it('deve exigir justificativa', async () => {
    const auditRes = await request(app).get('/api/v1/auditoria?acao=criar&por_pagina=1')
    const entry = auditRes.body.dados[0]

    const res = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('deve retornar 404 para id inexistente', async () => {
    const res = await request(app)
      .post('/api/v1/auditoria/inexistente/reverter')
      .send({ justificativa: 'Teste' })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/auditoria/:id/reverter — Reversão de exclusão de paciente', () => {
  it('deve re-inserir paciente DELETE\'d usando payload', async () => {
    // Criar paciente
    const createRes = await request(app)
      .post('/api/v1/pacientes')
      .send({ nome: 'Para Reverter Exclusão', convenio: 'Camperj', modalidade: 'AD' })
    const pacId = createRes.body.id

    // Excluir
    await request(app)
      .delete(`/api/v1/pacientes/${pacId}`)
      .send({ justificativa: 'Teste' })

    // Confirmar que sumiu
    const checkRes = await request(app).get(`/api/v1/pacientes/${pacId}`)
    expect(checkRes.status).toBe(404)

    // Encontrar audit da exclusão
    const auditRes = await request(app).get('/api/v1/auditoria?acao=excluir&entidade=paciente&por_pagina=50')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === pacId)
    expect(entry).toBeDefined()

    // Reverter exclusão
    const revertRes = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Re-inserção via teste' })
    expect(revertRes.status).toBe(200)

    // Paciente deve ter voltado
    const getRes = await request(app).get(`/api/v1/pacientes/${pacId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.nome).toBe('Para Reverter Exclusão')
    expect(getRes.body.ativo).toBe(1)
  })
})

describe('Payload de reversão', () => {
  it('deve incluir antes/depois e original_entry no payload', async () => {
    // Criar paciente
    const createRes = await request(app)
      .post('/api/v1/pacientes')
      .send({ nome: 'Payload Reverter', convenio: 'Unimed', modalidade: 'ID' })
    const pacId = createRes.body.id

    // Encontrar audit da criação
    const auditRes = await request(app).get('/api/v1/auditoria?acao=criar&entidade=paciente&por_pagina=50')
    const entry = auditRes.body.dados.find((e: Record<string, unknown>) => e.entidade_id === pacId)

    // Reverter
    const revertRes = await request(app)
      .post(`/api/v1/auditoria/${entry.id}/reverter`)
      .send({ justificativa: 'Teste payload' })

    // Buscar a reversão
    const auditRes2 = await request(app).get('/api/v1/auditoria?por_pagina=50')
    const reversal = auditRes2.body.dados.find((e: Record<string, unknown>) => e.id === revertRes.body.reversal_id)
    expect(reversal.payload).toBeTruthy()
    const parsed = JSON.parse(reversal.payload)
    expect(parsed).toHaveProperty('original_entry')
    expect(parsed).toHaveProperty('antes')
    expect(parsed).toHaveProperty('depois')
    expect(parsed).toHaveProperty('justificativa')
    expect(parsed.original_entry.acao).toBe('criar')
  })
})

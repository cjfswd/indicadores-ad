import { describe, it, expect } from 'vitest'
import {
  pacienteSchema,
  eventoPacienteSchema,
  tipoEventoSchema,
  metaSchema,
  indicadorCodigoSchema,
  registroMensalSchema,
  usuarioSchema,
  perfilSchema,
} from '../index.js'

// ═══════════════════════════════════════════════════════
// Paciente
// ═══════════════════════════════════════════════════════
describe('pacienteSchema', () => {
  it('deve aceitar dados válidos mínimos', () => {
    const result = pacienteSchema.safeParse({ nome: 'João Silva', convenio: 'Camperj', modalidade: 'AD' })
    expect(result.success).toBe(true)
  })

  it('deve aceitar dados completos', () => {
    const result = pacienteSchema.safeParse({
      nome: 'Maria Santos',
      convenio: 'Unimed',
      modalidade: 'ID',
      data_nascimento: '1985-03-15',
      observacoes: 'Paciente estável',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar nome com menos de 3 caracteres', () => {
    const result = pacienteSchema.safeParse({ nome: 'AB', convenio: 'Camperj', modalidade: 'AD' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar nome vazio', () => {
    const result = pacienteSchema.safeParse({ nome: '', convenio: 'Camperj', modalidade: 'AD' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar convênio inválido', () => {
    const result = pacienteSchema.safeParse({ nome: 'Teste', convenio: 'SUS', modalidade: 'AD' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar modalidade inválida', () => {
    const result = pacienteSchema.safeParse({ nome: 'Teste', convenio: 'Camperj', modalidade: 'XX' })
    expect(result.success).toBe(false)
  })

  it('deve aceitar data_nascimento null', () => {
    const result = pacienteSchema.safeParse({ nome: 'Teste', convenio: 'Camperj', modalidade: 'AD', data_nascimento: null })
    expect(result.success).toBe(true)
  })

  it('deve tratar string vazia em data_nascimento como null', () => {
    const result = pacienteSchema.safeParse({ nome: 'Teste', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.data_nascimento).toBeNull()
  })

  it('deve tratar string vazia em observacoes como null', () => {
    const result = pacienteSchema.safeParse({ nome: 'Teste', convenio: 'Camperj', modalidade: 'AD', observacoes: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.observacoes).toBeNull()
  })

  it('deve rejeitar data_nascimento formato inválido', () => {
    const result = pacienteSchema.safeParse({ nome: 'Teste', convenio: 'Camperj', modalidade: 'AD', data_nascimento: '15/03/1985' })
    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// Evento Paciente
// ═══════════════════════════════════════════════════════
describe('tipoEventoSchema', () => {
  const tiposValidos = ['alta_domiciliar', 'intercorrencia', 'internacao', 'obito', 'evento_adverso', 'infeccao', 'alteracao_pad']

  it.each(tiposValidos)('deve aceitar tipo "%s"', (tipo) => {
    expect(tipoEventoSchema.safeParse(tipo).success).toBe(true)
  })

  it('deve rejeitar tipo inválido', () => {
    expect(tipoEventoSchema.safeParse('consulta').success).toBe(false)
  })
})

describe('eventoPacienteSchema', () => {
  it('deve aceitar evento com campos mínimos', () => {
    const result = eventoPacienteSchema.safeParse({ tipo_evento: 'obito' })
    expect(result.success).toBe(true)
  })

  it('deve aceitar evento completo', () => {
    const result = eventoPacienteSchema.safeParse({
      tipo_evento: 'evento_adverso',
      subtipo: 'queda',
      data_evento: '2026-04-10',
      descricao: 'Queda no banheiro',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar descrição com mais de 500 caracteres', () => {
    const result = eventoPacienteSchema.safeParse({
      tipo_evento: 'obito',
      descricao: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// Meta
// ═══════════════════════════════════════════════════════
describe('indicadorCodigoSchema', () => {
  it.each(['01', '05', '09'])('deve aceitar código "%s"', (code) => {
    expect(indicadorCodigoSchema.safeParse(code).success).toBe(true)
  })

  it.each(['00', '10', '1', 'A1', ''])('deve rejeitar código "%s"', (code) => {
    expect(indicadorCodigoSchema.safeParse(code).success).toBe(false)
  })
})

describe('metaSchema', () => {
  it('deve aceitar meta válida', () => {
    const result = metaSchema.safeParse({
      indicador_codigo: '01',
      ano: 2026,
      meta_valor: 95,
      limite_alerta: 90,
    })
    expect(result.success).toBe(true)
  })

  it('deve aceitar meta_valor null', () => {
    const result = metaSchema.safeParse({
      indicador_codigo: '01',
      ano: 2026,
      meta_valor: null,
      limite_alerta: null,
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar ano fora do range', () => {
    const result = metaSchema.safeParse({
      indicador_codigo: '01',
      ano: 2019,
      meta_valor: 95,
      limite_alerta: 90,
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar meta_valor negativo', () => {
    const result = metaSchema.safeParse({
      indicador_codigo: '01',
      ano: 2026,
      meta_valor: -1,
      limite_alerta: 90,
    })
    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// Registro Mensal
// ═══════════════════════════════════════════════════════
describe('registroMensalSchema', () => {
  it('deve aceitar registro com campos mínimos', () => {
    const result = registroMensalSchema.safeParse({ ano: 2026, mes: 4 })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar mês 0', () => {
    const result = registroMensalSchema.safeParse({ ano: 2026, mes: 0 })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar mês 13', () => {
    const result = registroMensalSchema.safeParse({ ano: 2026, mes: 13 })
    expect(result.success).toBe(false)
  })

  it('deve aceitar todos os campos numéricos', () => {
    const result = registroMensalSchema.safeParse({
      ano: 2026,
      mes: 3,
      taxa_altas_pct: 17.9,
      intercorrencias_total: 5,
      pacientes_total: 88,
      obitos_total: 3,
    })
    expect(result.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// Usuário
// ═══════════════════════════════════════════════════════
describe('perfilSchema', () => {
  it.each(['admin', 'editor', 'visualizador'])('deve aceitar perfil "%s"', (perfil) => {
    expect(perfilSchema.safeParse(perfil).success).toBe(true)
  })

  it('deve rejeitar perfil inválido', () => {
    expect(perfilSchema.safeParse('superadmin').success).toBe(false)
  })
})

describe('usuarioSchema', () => {
  it('deve aceitar usuário válido', () => {
    const result = usuarioSchema.safeParse({
      nome: 'Admin',
      email: 'admin@clinica.com',
      perfil: 'admin',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar email inválido', () => {
    const result = usuarioSchema.safeParse({
      nome: 'Admin',
      email: 'not-email',
      perfil: 'admin',
    })
    expect(result.success).toBe(false)
  })
})

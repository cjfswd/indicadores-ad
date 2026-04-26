import { v4 as uuid } from 'uuid'
import { getKysely, isProduction } from '../config/database.js'
import { logger } from '../lib/logger.js'

export async function seedDatabase() {
  // Skip seeding in production — data is persisted in PostgreSQL
  if (isProduction()) return

  const db = getKysely()

  const count = await db
    .selectFrom('pacientes')
    .select(({ fn }) => fn.countAll<number>().as('total'))
    .executeTakeFirstOrThrow()

  if (count.total > 0) return

  // ─── Pacientes ───
  const pacientes = [
    { nome: 'Maria Silva Santos', convenio: 'Camperj' as const, modalidade: 'AD' as const, data_nascimento: '1948-03-12', observacoes: null },
    { nome: 'João Carlos Pereira', convenio: 'Unimed' as const, modalidade: 'ID' as const, data_nascimento: '1955-07-20', observacoes: 'Paciente com traqueostomia' },
    { nome: 'Ana Beatriz Oliveira', convenio: 'Camperj' as const, modalidade: 'AD' as const, data_nascimento: '1940-11-05', observacoes: null },
    { nome: 'Pedro Augusto Lima', convenio: 'Unimed' as const, modalidade: 'ID' as const, data_nascimento: '1962-01-30', observacoes: null },
    { nome: 'Francisca das Dores', convenio: 'Camperj' as const, modalidade: 'AD' as const, data_nascimento: '1938-09-18', observacoes: null },
    { nome: 'Roberto Mendes Junior', convenio: 'Camperj' as const, modalidade: 'AD' as const, data_nascimento: '1970-05-14', observacoes: 'Dieta por GTT' },
    { nome: 'Luciana Ferraz Costa', convenio: 'Unimed' as const, modalidade: 'AD' as const, data_nascimento: '1985-12-01', observacoes: null },
    { nome: 'Antônio de Souza', convenio: 'Camperj' as const, modalidade: 'AD' as const, data_nascimento: '1945-06-22', observacoes: null },
  ]

  const pacienteIds: string[] = []
  for (const pac of pacientes) {
    const id = uuid()
    pacienteIds.push(id)
    await db.insertInto('pacientes').values({ id, ...pac }).execute()
  }

  // ─── Registros mensais ───
  await db.insertInto('registros_mensais').values({
    id: uuid(), ano: 2026, mes: 4,
    taxa_altas_pct: 20.0, intercorrencias_total: 8, intercorr_removidas_dom: 5, intercorr_necessidade_rem: 3,
    taxa_internacao_pct: 4.4, intern_deterioracao: 3, intern_nao_aderencia: 1,
    obitos_total: 2, obitos_menos_48h: 0, obitos_mais_48h: 2,
    taxa_alteracao_pad_pct: 3.3, pacientes_total: 90, pacientes_ad: 72, pacientes_id: 18,
    pacientes_infectados: 5, infeccao_atb_48h: 3, eventos_adversos_total: 4,
    ea_quedas: 2, ea_broncoaspiracao: 0, ea_lesao_pressao: 1, ea_decanulacao: 0, ea_saida_gtt: 1,
    ouvidorias_total: 12, ouv_elogios: 7, ouv_sugestoes: 3, ouv_reclamacoes: 2,
    status: 'rascunho',
  }).execute()

  await db.insertInto('registros_mensais').values({
    id: uuid(), ano: 2026, mes: 3,
    taxa_altas_pct: 17.9, intercorrencias_total: 5, intercorr_removidas_dom: 4, intercorr_necessidade_rem: 1,
    taxa_internacao_pct: 5.0, intern_deterioracao: 2, intern_nao_aderencia: 2,
    obitos_total: 3, obitos_menos_48h: 1, obitos_mais_48h: 2,
    taxa_alteracao_pad_pct: 2.8, pacientes_total: 88, pacientes_ad: 70, pacientes_id: 18,
    pacientes_infectados: 4, infeccao_atb_48h: 2, eventos_adversos_total: 2,
    ea_quedas: 1, ea_broncoaspiracao: 0, ea_lesao_pressao: 1, ea_decanulacao: 0, ea_saida_gtt: 0,
    ouvidorias_total: 10, ouv_elogios: 5, ouv_sugestoes: 3, ouv_reclamacoes: 2,
    status: 'confirmado',
  }).execute()

  // ─── Metas ───
  const metas = [
    { indicador_codigo: '01', meta_valor: 20, limite_alerta: 15, sentido: 'maior' as const },
    { indicador_codigo: '02', meta_valor: 3, limite_alerta: 6, sentido: 'menor' as const },
    { indicador_codigo: '03', meta_valor: 5, limite_alerta: 10, sentido: 'menor' as const },
    { indicador_codigo: '04', meta_valor: 1, limite_alerta: 3, sentido: 'menor' as const },
    { indicador_codigo: '05', meta_valor: null, limite_alerta: null, sentido: 'neutro' as const },
    { indicador_codigo: '06', meta_valor: null, limite_alerta: null, sentido: 'neutro' as const },
    { indicador_codigo: '07', meta_valor: 2, limite_alerta: 5, sentido: 'menor' as const },
    { indicador_codigo: '08', meta_valor: 0, limite_alerta: 2, sentido: 'menor' as const },
    { indicador_codigo: '09', meta_valor: 0, limite_alerta: 2, sentido: 'menor' as const },
  ]

  for (const m of metas) {
    await db.insertInto('metas').values({ id: uuid(), ano: 2026, ...m }).execute()
  }

  // ─── Eventos de exemplo (Abril 2026) ───
  const pacsOrdered = await db
    .selectFrom('pacientes')
    .select(['id', 'nome'])
    .orderBy('nome')
    .execute()

  const eventosSeed = [
    { idx: 0, tipo: 'intercorrencia', desc: 'Febre alta, remoção domiciliar', data: '2026-04-03' },
    { idx: 1, tipo: 'intercorrencia', desc: 'Queda de saturação', data: '2026-04-05' },
    { idx: 2, tipo: 'intercorrencia', desc: 'Sangramento no curativo', data: '2026-04-07' },
    { idx: 3, tipo: 'ea_queda', desc: 'Queda da cama durante a noite', data: '2026-04-08' },
    { idx: 4, tipo: 'ea_lesao_pressao', desc: 'Lesão grau 2 em sacro', data: '2026-04-10' },
    { idx: 5, tipo: 'infectado', desc: 'ITU diagnosticada', data: '2026-04-11' },
    { idx: 0, tipo: 'alta', desc: 'Alta programada — meta atingida', data: '2026-04-12' },
    { idx: 6, tipo: 'intern_deterioracao', desc: 'Piora respiratória, encaminhado ao hospital', data: '2026-04-14' },
    { idx: 1, tipo: 'ouvidoria_elogio', desc: 'Família elogiou equipe de enfermagem', data: '2026-04-15' },
    { idx: 7, tipo: 'ouvidoria_reclamacao', desc: 'Atraso na entrega de oxigênio', data: '2026-04-16' },
    { idx: 2, tipo: 'obito', desc: 'Óbito em domicílio, >48h implantação', data: '2026-04-17' },
  ] as const

  for (const ev of eventosSeed) {
    const pac = pacsOrdered[ev.idx]
    const evId = uuid()

    await db.insertInto('eventos_pacientes').values({
      id: evId,
      paciente_id: pac.id,
      ano: 2026,
      mes: 4,
      tipo_evento: ev.tipo,
      descricao: ev.desc,
      data_evento: ev.data,
    }).execute()

    const payload = JSON.stringify({
      id: evId, paciente_id: pac.id, paciente_nome: pac.nome,
      tipo_evento: ev.tipo, descricao: ev.desc, data_evento: ev.data, ano: 2026, mes: 4,
    })

    const seedEmails = [
      'coordenacao@healthmaiscuidados.com',
      'enfermagem@healthmaiscuidados.com',
      'qualidade@healthmaiscuidados.com',
    ] as const

    await db.insertInto('audit_log').values({
      id: uuid(),
      entidade: 'evento_paciente',
      entidade_id: evId,
      acao: 'criar',
      usuario_email: seedEmails[ev.idx % seedEmails.length],
      campo_alterado: ev.tipo,
      valor_novo: pac.nome,
      timestamp: `${ev.data} 10:00:00`,
      payload,
    }).execute()
  }

  logger.info('Seed: 8 pacientes (Camperj/Unimed), 2 registros, 9 metas, 11 eventos')
}

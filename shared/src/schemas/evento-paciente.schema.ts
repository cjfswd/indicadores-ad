import { z } from 'zod'

export const tipoEventoSchema = z.enum([
  'alta_domiciliar',
  'intercorrencia',
  'internacao',
  'obito',
  'evento_adverso',
  'infeccao',
  'alteracao_pad',
])
export type TipoEvento = z.infer<typeof tipoEventoSchema>

export const eventoPacienteSchema = z.object({
  tipo_evento: tipoEventoSchema,
  subtipo: z.string().max(50).nullable().optional(),
  data_evento: z.string().date().nullable().optional(),
  descricao: z.string().max(500).nullable().optional(),
  observacao_texto: z.string().max(5000).nullable().optional(),
  documentacao_url: z.string().url().max(500).nullable().optional(),
})

export type EventoPaciente = z.infer<typeof eventoPacienteSchema>

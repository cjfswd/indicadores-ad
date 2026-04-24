import { z } from 'zod'

export const indicadorCodigoSchema = z.string().regex(
  /^0[1-9]$/,
  'Código do indicador deve ser 01 a 09',
)

export const metaSchema = z.object({
  indicador_codigo: indicadorCodigoSchema,
  ano: z.number().int().min(2020).max(2099),
  meta_valor: z.number().min(0).nullable(),
  limite_alerta: z.number().min(0).nullable(),
}).refine(
  (data) => {
    if (data.meta_valor != null && data.limite_alerta != null) {
      return data.limite_alerta >= data.meta_valor || data.limite_alerta <= data.meta_valor
    }
    return true
  },
  { message: 'meta_valor e limite_alerta devem ser coerentes', path: ['limite_alerta'] },
)

export type Meta = z.infer<typeof metaSchema>

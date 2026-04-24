import { z } from 'zod'

// ═══ Bloco 01 — Taxa de Altas ═══
// ═══ Bloco 02 — Intercorrências ═══
// ═══ Bloco 03 — Taxa Internação ═══
// ═══ Bloco 04 — Óbitos ═══
// ═══ Bloco 05 — Alteração PAD ═══
// ═══ Bloco 06 — Censo AD/ID ═══
// ═══ Bloco 07 — Infectados ═══
// ═══ Bloco 08 — Eventos Adversos ═══
// ═══ Bloco 09 — Ouvidorias ═══

export const registroMensalSchema = z.object({
  ano: z.number().int().min(2020).max(2099),
  mes: z.number().int().min(1).max(12),

  // Bloco 01
  taxa_altas_pct: z.number().min(0).max(100).nullable().optional(),

  // Bloco 02
  intercorrencias_total: z.number().int().min(0).nullable().optional(),
  intercorr_removidas_dom: z.number().int().min(0).nullable().optional(),
  intercorr_necessidade_rem: z.number().int().min(0).nullable().optional(),

  // Bloco 03
  taxa_internacao_pct: z.number().min(0).max(100).nullable().optional(),
  intern_deterioracao: z.number().int().min(0).nullable().optional(),
  intern_nao_aderencia: z.number().int().min(0).nullable().optional(),

  // Bloco 04
  obitos_total: z.number().int().min(0).nullable().optional(),
  obitos_menos_48h: z.number().int().min(0).nullable().optional(),
  obitos_mais_48h: z.number().int().min(0).nullable().optional(),

  // Bloco 05
  taxa_alteracao_pad_pct: z.number().min(0).max(100).nullable().optional(),

  // Bloco 06
  pacientes_total: z.number().int().min(0).nullable().optional(),
  pacientes_ad: z.number().int().min(0).nullable().optional(),
  pacientes_id: z.number().int().min(0).nullable().optional(),

  // Bloco 07
  pacientes_infectados: z.number().int().min(0).nullable().optional(),

  // Bloco 08
  eventos_adversos_total: z.number().int().min(0).nullable().optional(),
  ea_quedas: z.number().int().min(0).nullable().optional(),
  ea_broncoaspiracao: z.number().int().min(0).nullable().optional(),
  ea_lesao_pressao: z.number().int().min(0).nullable().optional(),
  ea_decanulacao: z.number().int().min(0).nullable().optional(),
  ea_saida_gtt: z.number().int().min(0).nullable().optional(),

  // Bloco 09
  ouvidorias_total: z.number().int().min(0).nullable().optional(),
  ouv_elogios: z.number().int().min(0).nullable().optional(),
  ouv_sugestoes: z.number().int().min(0).nullable().optional(),
  ouv_reclamacoes: z.number().int().min(0).nullable().optional(),
}).refine(
  (data) => {
    if (data.obitos_total != null && data.obitos_menos_48h != null && data.obitos_mais_48h != null) {
      return data.obitos_total === data.obitos_menos_48h + data.obitos_mais_48h
    }
    return true
  },
  { message: 'obitos_total deve ser igual a obitos_menos_48h + obitos_mais_48h', path: ['obitos_total'] },
).refine(
  (data) => {
    if (data.pacientes_total != null && data.pacientes_ad != null && data.pacientes_id != null) {
      return data.pacientes_total === data.pacientes_ad + data.pacientes_id
    }
    return true
  },
  { message: 'pacientes_total deve ser igual a pacientes_ad + pacientes_id', path: ['pacientes_total'] },
).refine(
  (data) => {
    if (
      data.eventos_adversos_total != null &&
      data.ea_quedas != null && data.ea_broncoaspiracao != null &&
      data.ea_lesao_pressao != null && data.ea_decanulacao != null && data.ea_saida_gtt != null
    ) {
      const soma = data.ea_quedas + data.ea_broncoaspiracao + data.ea_lesao_pressao + data.ea_decanulacao + data.ea_saida_gtt
      return data.eventos_adversos_total >= soma
    }
    return true
  },
  { message: 'eventos_adversos_total deve ser >= soma dos subtipos', path: ['eventos_adversos_total'] },
)

export type RegistroMensal = z.infer<typeof registroMensalSchema>

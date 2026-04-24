import { sql } from 'kysely'
import type { Kysely } from 'kysely'
import type { Database, RegistroMensalTable } from '../config/db.schema.js'
import { now } from './sql-helpers.js'

/** Mapeia tipo_evento → coluna no registros_mensais */
export const CAMPO_MAP: Record<string, keyof RegistroMensalTable> = {
  'intercorrencia': 'intercorrencias_total',
  'intercorr_removida_dom': 'intercorr_removidas_dom',
  'intercorr_necessidade_rem': 'intercorr_necessidade_rem',
  'internacao': 'taxa_internacao_pct',
  'intern_deterioracao': 'intern_deterioracao',
  'intern_nao_aderencia': 'intern_nao_aderencia',
  'obito': 'obitos_total',
  'obito_menos_48h': 'obitos_menos_48h',
  'obito_mais_48h': 'obitos_mais_48h',
  'infectado': 'pacientes_infectados',
  'ea_queda': 'ea_quedas',
  'ea_broncoaspiracao': 'ea_broncoaspiracao',
  'ea_lesao_pressao': 'ea_lesao_pressao',
  'ea_decanulacao': 'ea_decanulacao',
  'ea_saida_gtt': 'ea_saida_gtt',
  'evento_adverso': 'eventos_adversos_total',
  'ouvidoria_elogio': 'ouv_elogios',
  'ouvidoria_sugestao': 'ouv_sugestoes',
  'ouvidoria_reclamacao': 'ouv_reclamacoes',
  'alta': 'taxa_altas_pct',
}

/** Incrementa/decrementa a métrica correspondente no registro mensal */
export async function incrementarMetrica(
  db: Kysely<Database>,
  tipoEvento: string,
  ano: number,
  mes: number,
  delta: number,
): Promise<void> {
  const campo = CAMPO_MAP[tipoEvento]
  if (!campo) return

  const registro = await db
    .selectFrom('registros_mensais')
    .select('id')
    .where('ano', '=', ano)
    .where('mes', '=', mes)
    .executeTakeFirst()

  if (!registro) return

  if (delta > 0) {
    await db
      .updateTable('registros_mensais')
      .set({
        [campo]: sql`${sql.ref(campo)} + 1`,
        atualizado_em: now(),
      })
      .where('id', '=', registro.id)
      .execute()
  } else {
    await db
      .updateTable('registros_mensais')
      .set({
        [campo]: sql`MAX(0, ${sql.ref(campo)} - 1)`,
        atualizado_em: now(),
      })
      .where('id', '=', registro.id)
      .execute()
  }
}

/**
 * Metas Service — server-only.
 */
import { v4 as uuid } from "uuid"
import { getKysely, now } from "./db.server"

export async function listarMetas(ano: number) {
  const db = getKysely()
  const rows = await db
    .selectFrom("metas")
    .selectAll()
    .where("ano", "=", ano)
    .orderBy("indicador_codigo")
    .execute()
  return rows
}

export interface MetaInput {
  indicador_codigo: string
  ano: number
  mes_inicio?: number
  mes_fim?: number
  meta_valor: number | null
  limite_alerta: number | null
  sentido?: "maior" | "menor" | "neutro"
}

export async function salvarMeta(data: MetaInput, usuarioEmail: string) {
  const db = getKysely()

  const existing = await db
    .selectFrom("metas")
    .selectAll()
    .where("indicador_codigo", "=", data.indicador_codigo)
    .where("ano", "=", data.ano)
    .where("mes_inicio", "=", data.mes_inicio ?? 1)
    .where("mes_fim", "=", data.mes_fim ?? 12)
    .executeTakeFirst()

  if (existing) {
    await db.updateTable("metas")
      .set({
        meta_valor: data.meta_valor,
        limite_alerta: data.limite_alerta,
        sentido: data.sentido ?? "menor",
        atualizado_por: usuarioEmail,
        atualizado_em: now(),
      })
      .where("id", "=", existing.id)
      .execute()

    return db.selectFrom("metas").selectAll().where("id", "=", existing.id).executeTakeFirstOrThrow()
  }

  const id = uuid()
  await db.insertInto("metas").values({
    id,
    indicador_codigo: data.indicador_codigo,
    ano: data.ano,
    mes_inicio: data.mes_inicio ?? 1,
    mes_fim: data.mes_fim ?? 12,
    meta_valor: data.meta_valor,
    limite_alerta: data.limite_alerta,
    sentido: data.sentido ?? "menor",
    atualizado_por: usuarioEmail,
  }).execute()

  return db.selectFrom("metas").selectAll().where("id", "=", id).executeTakeFirstOrThrow()
}

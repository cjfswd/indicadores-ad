/**
 * Registros Mensais Service — server-only.
 * Shared between React Router loaders/actions and Express API routes.
 */
import { v4 as uuid } from "uuid"
import { sql, type Insertable, type Updateable } from "kysely"
import { getKysely, now } from "./db.server"
import type { RegistroMensalTable } from "~/server/config/db.schema.js"

// ─── Whitelist de campos ───
const CAMPOS_VALIDOS = new Set([
  "ano", "mes", "taxa_altas_pct", "intercorrencias_total", "intercorr_removidas_dom",
  "intercorr_necessidade_rem", "taxa_internacao_pct", "intern_deterioracao", "intern_nao_aderencia",
  "obitos_total", "obitos_menos_48h", "obitos_mais_48h", "taxa_alteracao_pad_pct",
  "pacientes_total", "pacientes_ad", "pacientes_id", "pacientes_infectados", "infeccao_atb_48h",
  "eventos_adversos_total", "ea_quedas", "ea_broncoaspiracao", "ea_lesao_pressao",
  "ea_decanulacao", "ea_saida_gtt", "ouvidorias_total", "ouv_elogios", "ouv_sugestoes", "ouv_reclamacoes",
])

function sanitizeData(body: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (CAMPOS_VALIDOS.has(k)) clean[k] = v
  }
  return clean
}

// ─── Queries ───

export async function listarRegistros(ano: number) {
  const db = getKysely()
  const rows = await db
    .selectFrom("registros_mensais")
    .selectAll()
    .where("ano", "=", ano)
    .orderBy("mes")
    .execute()
  return { dados: rows, ano }
}

export async function buscarRegistroRange(inicio: string, fim: string) {
  const db = getKysely()
  const [anoI, mesI] = inicio.split("-").map(Number)
  const [anoF, mesF] = fim.split("-").map(Number)

  const rows = await db
    .selectFrom("registros_mensais")
    .selectAll()
    .where(sql`(ano * 100 + mes)`, ">=", anoI * 100 + mesI)
    .where(sql`(ano * 100 + mes)`, "<=", anoF * 100 + mesF)
    .orderBy("ano")
    .orderBy("mes")
    .execute()

  return { dados: rows, inicio, fim }
}

export async function buscarRegistroMes(ano: number, mes: number) {
  const db = getKysely()
  return db
    .selectFrom("registros_mensais")
    .selectAll()
    .where("ano", "=", ano)
    .where("mes", "=", mes)
    .executeTakeFirst()
}

// ─── Mutations ───

export async function criarRegistro(
  body: Record<string, unknown>,
  usuarioEmail: string,
  arquivoUrl?: string | null,
) {
  const db = getKysely()
  const data = sanitizeData(body)

  if (!data.ano || !data.mes) throw new Error("ano e mes são obrigatórios")

  const existing = await db
    .selectFrom("registros_mensais")
    .select("id")
    .where("ano", "=", data.ano as number)
    .where("mes", "=", data.mes as number)
    .executeTakeFirst()

  if (existing) throw new Error(`Registro para ${data.ano}/${data.mes} já existe`)

  const id = uuid()

  await db.insertInto("registros_mensais")
    .values({ id, ...data } as Insertable<RegistroMensalTable>)
    .execute()

  const created = await db.selectFrom("registros_mensais").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "registro_mensal",
    entidade_id: id,
    acao: "criar",
    usuario_email: usuarioEmail,
    documentacao_url: arquivoUrl ?? null,
    payload: JSON.stringify(created),
  }).execute()

  return created
}

export async function editarRegistro(
  id: string,
  body: Record<string, unknown>,
  usuarioEmail: string,
  arquivoUrl?: string | null,
) {
  const db = getKysely()

  const antes = await db.selectFrom("registros_mensais").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Registro ${id} não encontrado`)

  const data = sanitizeData(body)

  await db.updateTable("registros_mensais")
    .set({ ...data, atualizado_em: now() } as unknown as Updateable<RegistroMensalTable>)
    .where("id", "=", id)
    .execute()

  const depois = await db.selectFrom("registros_mensais").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "registro_mensal",
    entidade_id: id,
    acao: "editar",
    usuario_email: usuarioEmail,
    documentacao_url: arquivoUrl ?? null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  return depois
}

export async function confirmarRegistro(id: string, usuarioEmail: string, arquivoUrl?: string | null) {
  const db = getKysely()

  const antes = await db.selectFrom("registros_mensais").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Registro ${id} não encontrado`)

  await db.updateTable("registros_mensais")
    .set({ status: "confirmado", atualizado_em: now() })
    .where("id", "=", id)
    .execute()

  const depois = await db.selectFrom("registros_mensais").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "registro_mensal",
    entidade_id: id,
    acao: "confirmar",
    usuario_email: usuarioEmail,
    documentacao_url: arquivoUrl ?? null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  return depois
}

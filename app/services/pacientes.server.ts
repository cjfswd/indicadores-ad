/**
 * Pacientes Service — server-only.
 * Shared between React Router loaders/actions and Express API routes.
 */
import { v4 as uuid } from "uuid"
import { getKysely, now } from "./db.server"

// ─── Types ───
export interface PacienteInput {
  nome: string
  data_nascimento?: string | null
  convenio: "Camperj" | "Unimed"
  modalidade: "AD" | "ID"
  observacoes?: string | null
}

export interface ListarPacientesParams {
  status?: string
  convenio?: string
  busca?: string
}

// ─── Queries ───

export async function listarPacientes(params: ListarPacientesParams = {}) {
  const db = getKysely()
  let query = db.selectFrom("pacientes").selectAll()

  const statusFilter = params.status ?? "ativo"
  if (statusFilter === "todos") query = query.where("status", "!=", "excluido")
  else if (statusFilter === "inativo") query = query.where("status", "=", "inativo")
  else query = query.where("status", "=", "ativo")

  if (params.convenio) query = query.where("convenio", "=", params.convenio as "Camperj" | "Unimed")
  if (params.busca) query = query.where("nome", "like", `%${params.busca}%`)

  const rows = await query.orderBy("convenio").orderBy("nome").execute()

  const agrupado: Record<string, typeof rows> = {}
  for (const row of rows) {
    const conv = row.convenio
    if (!agrupado[conv]) agrupado[conv] = []
    agrupado[conv].push(row)
  }

  return { dados: rows, agrupado, total: rows.length }
}

export async function buscarPaciente(id: string) {
  const db = getKysely()
  return db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirst()
}

export async function listarConvenios() {
  const db = getKysely()
  const rows = await db
    .selectFrom("pacientes")
    .select("convenio")
    .distinct()
    .where("status", "=", "ativo")
    .orderBy("convenio")
    .execute()
  return rows.map((r) => r.convenio)
}

// ─── Mutations ───

export async function criarPaciente(data: PacienteInput, usuarioEmail: string) {
  const db = getKysely()
  const id = uuid()

  await db.insertInto("pacientes").values({
    id,
    nome: data.nome,
    data_nascimento: data.data_nascimento ?? null,
    convenio: data.convenio ?? "Camperj",
    modalidade: data.modalidade ?? "AD",
    observacoes: data.observacoes ?? null,
  }).execute()

  const created = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "paciente",
    entidade_id: id,
    acao: "criar",
    usuario_email: usuarioEmail,
    valor_novo: data.nome,
    documentacao_url: null,
    payload: JSON.stringify(created),
  }).execute()

  return created
}

export async function editarPaciente(id: string, data: PacienteInput & { justificativa?: string }, usuarioEmail: string) {
  const db = getKysely()

  const antes = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Paciente ${id} não encontrado`)

  await db.updateTable("pacientes")
    .set({
      nome: data.nome,
      data_nascimento: data.data_nascimento ?? null,
      convenio: data.convenio,
      modalidade: data.modalidade,
      observacoes: data.observacoes ?? null,
      atualizado_em: now(),
    })
    .where("id", "=", id)
    .execute()

  const depois = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "paciente",
    entidade_id: id,
    acao: "editar",
    usuario_email: usuarioEmail,
    justificativa: data.justificativa || null,
    valor_anterior: antes.nome,
    valor_novo: data.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  return depois
}

export async function desativarPaciente(
  id: string,
  params: { justificativa?: string; motivo?: string; indicador?: string },
  usuarioEmail: string,
) {
  const db = getKysely()

  const antes = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Paciente ${id} não encontrado`)

  await db.updateTable("pacientes")
    .set({
      status: "inativo" as const,
      motivo_desativacao: params.motivo ?? null,
      indicador_desativacao: params.indicador ?? null,
      atualizado_em: now(),
    })
    .where("id", "=", id)
    .execute()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "paciente",
    entidade_id: id,
    acao: "desativar",
    usuario_email: usuarioEmail,
    justificativa: params.justificativa || null,
    valor_anterior: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, motivo: params.motivo, indicador: params.indicador }),
  }).execute()

  return { message: "Paciente desativado", id }
}

export async function excluirPaciente(id: string, justificativa: string, usuarioEmail: string) {
  const db = getKysely()

  if (!justificativa?.trim()) throw new Error("Justificativa obrigatória para excluir paciente")

  const antes = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Paciente ${id} não encontrado`)
  if (antes.status === "excluido") throw new Error("Paciente já está excluído")

  await db.updateTable("pacientes")
    .set({ status: "excluido" as const, atualizado_em: now() })
    .where("id", "=", id)
    .execute()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "paciente",
    entidade_id: id,
    acao: "excluir",
    usuario_email: usuarioEmail,
    justificativa,
    valor_anterior: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes }),
  }).execute()
}

export async function reativarPaciente(id: string, justificativa: string | undefined, usuarioEmail: string) {
  const db = getKysely()

  const antes = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Paciente ${id} não encontrado`)
  if (antes.status === "ativo") throw new Error("Paciente já está ativo")
  if (antes.status === "excluido") throw new Error("Paciente excluído não pode ser reativado por esta rota")

  await db.updateTable("pacientes")
    .set({
      status: "ativo" as const,
      motivo_desativacao: null,
      indicador_desativacao: null,
      atualizado_em: now(),
    })
    .where("id", "=", id)
    .execute()

  const depois = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "paciente",
    entidade_id: id,
    acao: "reativar",
    usuario_email: usuarioEmail,
    justificativa: justificativa || null,
    valor_novo: antes.nome,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  return depois
}

export async function transferirPaciente(
  id: string,
  convenio: "Camperj" | "Unimed",
  justificativa: string | undefined,
  usuarioEmail: string,
) {
  const db = getKysely()

  const antes = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirst()
  if (!antes) throw new Error(`Paciente ${id} não encontrado`)

  await db.updateTable("pacientes")
    .set({ convenio, atualizado_em: now() })
    .where("id", "=", id)
    .execute()

  const depois = await db.selectFrom("pacientes").selectAll().where("id", "=", id).executeTakeFirstOrThrow()

  await db.insertInto("audit_log").values({
    id: uuid(),
    entidade: "paciente",
    entidade_id: id,
    acao: "editar",
    usuario_email: usuarioEmail,
    campo_alterado: "convenio",
    justificativa: justificativa || null,
    valor_anterior: antes.convenio,
    valor_novo: convenio,
    documentacao_url: null,
    payload: JSON.stringify({ antes, depois }),
  }).execute()

  return depois
}

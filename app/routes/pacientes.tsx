import type { Route } from "./+types/pacientes"
import { data } from "react-router"
import {
  listarPacientes,
  criarPaciente,
  editarPaciente,
  desativarPaciente,
  excluirPaciente,
  reativarPaciente,
  transferirPaciente,
} from "~/services/pacientes.server"
import { initializeDatabase } from "~/services/db.server"
import { PacientesPage } from "./PacientesPage"

export async function loader({ request }: Route.LoaderArgs) {
  await initializeDatabase()
  const url = new URL(request.url)
  const status = url.searchParams.get("status") ?? "ativo"
  const convenio = url.searchParams.get("convenio") ?? undefined
  const busca = url.searchParams.get("busca") ?? undefined

  const result = await listarPacientes({ status, convenio, busca })
  return result
}

export async function action({ request }: Route.ActionArgs) {
  await initializeDatabase()
  const formData = await request.formData()
  const intent = formData.get("intent") as string
  const usuarioEmail = formData.get("_userEmail") as string ?? "sistema"

  switch (intent) {
    case "criar": {
      const paciente = await criarPaciente({
        nome: formData.get("nome") as string,
        data_nascimento: formData.get("data_nascimento") as string || null,
        convenio: formData.get("convenio") as "Camperj" | "Unimed",
        modalidade: formData.get("modalidade") as "AD" | "ID",
        observacoes: formData.get("observacoes") as string || null,
      }, usuarioEmail)
      return data({ ok: true, paciente }, { status: 201 })
    }
    case "editar": {
      const id = formData.get("id") as string
      const paciente = await editarPaciente(id, {
        nome: formData.get("nome") as string,
        data_nascimento: formData.get("data_nascimento") as string || null,
        convenio: formData.get("convenio") as "Camperj" | "Unimed",
        modalidade: formData.get("modalidade") as "AD" | "ID",
        observacoes: formData.get("observacoes") as string || null,
        justificativa: formData.get("justificativa") as string || undefined,
      }, usuarioEmail)
      return data({ ok: true, paciente })
    }
    case "desativar": {
      const id = formData.get("id") as string
      await desativarPaciente(id, {
        justificativa: formData.get("justificativa") as string || undefined,
        motivo: formData.get("motivo") as string || undefined,
        indicador: formData.get("indicador") as string || undefined,
      }, usuarioEmail)
      return data({ ok: true })
    }
    case "excluir": {
      const id = formData.get("id") as string
      await excluirPaciente(id, formData.get("justificativa") as string, usuarioEmail)
      return data({ ok: true })
    }
    case "reativar": {
      const id = formData.get("id") as string
      await reativarPaciente(id, formData.get("justificativa") as string || undefined, usuarioEmail)
      return data({ ok: true })
    }
    case "transferir": {
      const id = formData.get("id") as string
      await transferirPaciente(
        id,
        formData.get("convenio") as "Camperj" | "Unimed",
        formData.get("justificativa") as string || undefined,
        usuarioEmail,
      )
      return data({ ok: true })
    }
    default:
      return data({ error: `Intent desconhecido: ${intent}` }, { status: 400 })
  }
}

export default function Pacientes({ loaderData }: Route.ComponentProps) {
  return <PacientesPage serverData={loaderData} />
}

import type { Route } from "./+types/registros"
import { data } from "react-router"
import { listarRegistros, criarRegistro, editarRegistro, confirmarRegistro } from "~/services/registros.server"
import { initializeDatabase } from "~/services/db.server"
import { RegistroPage } from "./RegistroPage"

export async function loader({ request }: Route.LoaderArgs) {
  await initializeDatabase()
  const url = new URL(request.url)
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear()
  const result = await listarRegistros(ano)
  return result
}

export async function action({ request }: Route.ActionArgs) {
  await initializeDatabase()
  const formData = await request.formData()
  const intent = formData.get("intent") as string
  const usuarioEmail = formData.get("_userEmail") as string ?? "sistema"

  switch (intent) {
    case "criar": {
      const body = Object.fromEntries(formData.entries())
      const registro = await criarRegistro(body, usuarioEmail)
      return data({ ok: true, registro }, { status: 201 })
    }
    case "editar": {
      const id = formData.get("id") as string
      const body = Object.fromEntries(formData.entries())
      const registro = await editarRegistro(id, body, usuarioEmail)
      return data({ ok: true, registro })
    }
    case "confirmar": {
      const id = formData.get("id") as string
      const registro = await confirmarRegistro(id, usuarioEmail)
      return data({ ok: true, registro })
    }
    default:
      return data({ error: `Intent desconhecido: ${intent}` }, { status: 400 })
  }
}

export default function Registros({ loaderData }: Route.ComponentProps) {
  return <RegistroPage serverData={loaderData} />
}

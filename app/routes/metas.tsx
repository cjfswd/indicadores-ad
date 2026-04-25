import type { Route } from "./+types/metas"
import { data } from "react-router"
import { listarMetas, salvarMeta, type MetaInput } from "~/services/metas.server"
import { initializeDatabase } from "~/services/db.server"
import { MetasPage } from "./MetasPage"

export async function loader({ request }: Route.LoaderArgs) {
  await initializeDatabase()
  const url = new URL(request.url)
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear()
  const metas = await listarMetas(ano)
  return { metas, ano }
}

export async function action({ request }: Route.ActionArgs) {
  await initializeDatabase()
  const formData = await request.formData()
  const usuarioEmail = formData.get("_userEmail") as string ?? "sistema"

  const metaInput: MetaInput = {
    indicador_codigo: formData.get("indicador_codigo") as string,
    ano: Number(formData.get("ano")),
    mes_inicio: Number(formData.get("mes_inicio") ?? 1),
    mes_fim: Number(formData.get("mes_fim") ?? 12),
    meta_valor: formData.get("meta_valor") ? Number(formData.get("meta_valor")) : null,
    limite_alerta: formData.get("limite_alerta") ? Number(formData.get("limite_alerta")) : null,
    sentido: (formData.get("sentido") as "maior" | "menor" | "neutro") ?? "menor",
  }

  const meta = await salvarMeta(metaInput, usuarioEmail)
  return data({ ok: true, meta })
}

export default function Metas({ loaderData }: Route.ComponentProps) {
  return <MetasPage serverData={loaderData} />
}

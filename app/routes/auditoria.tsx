import type { Route } from "./+types/auditoria"
import { listarAuditLogs } from "~/services/auditoria.server"
import { initializeDatabase } from "~/services/db.server"
import { AuditoriaPage } from "./AuditoriaPage"

export async function loader({ request }: Route.LoaderArgs) {
  await initializeDatabase()
  const url = new URL(request.url)

  const filters = {
    entidade: url.searchParams.get("entidade") ?? undefined,
    acao: url.searchParams.get("acao") ?? undefined,
    entidade_id: url.searchParams.get("entidade_id") ?? undefined,
    limite: Number(url.searchParams.get("limite") ?? 100),
    offset: Number(url.searchParams.get("offset") ?? 0),
  }

  const result = await listarAuditLogs(filters)
  return result
}

export default function Auditoria({ loaderData }: Route.ComponentProps) {
  return <AuditoriaPage serverData={loaderData} />
}

import type { Route } from "./+types/dashboard"
import { buscarSemaforo } from "~/services/semaforo.server"
import { buscarRegistroMes } from "~/services/registros.server"
import { initializeDatabase } from "~/services/db.server"
import { DashboardPage } from "./DashboardPage"

export async function loader({ request }: Route.LoaderArgs) {
  await initializeDatabase()
  const url = new URL(request.url)
  const now = new Date()
  const ano = Number(url.searchParams.get("ano")) || now.getFullYear()
  const mes = Number(url.searchParams.get("mes")) || now.getMonth() + 1

  const [semaforo, registro] = await Promise.all([
    buscarSemaforo(ano, mes),
    buscarRegistroMes(ano, mes).catch(() => null),
  ])

  return { semaforo, registro, ano, mes }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return <DashboardPage serverData={loaderData} />
}

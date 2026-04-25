import type { RouteConfig } from "@react-router/dev/routes"
import { index, layout, route } from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),
  layout("routes/_layout.tsx", [
    index("routes/dashboard.tsx"),
    route("dashboard", "routes/dashboard-alias.tsx"),
    route("registros", "routes/registros.tsx"),
    route("pacientes", "routes/pacientes.tsx"),
    route("metas", "routes/metas.tsx"),
    route("auditoria", "routes/auditoria.tsx"),
  ]),
] satisfies RouteConfig

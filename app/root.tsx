import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"
import type { Route } from "./+types/root"
import { AuthProvider } from "./contexts/AuthContext"
import "./index.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="Dashboard de indicadores assistenciais para equipes de Atenção Domiciliar" />
        <title>Indicadores AD — Atenção Domiciliar</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "Ocorreu um erro inesperado."

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : `${error.status}`
    details = error.status === 404
      ? "Página não encontrada."
      : error.statusText || details
  } else if (error instanceof Error) {
    details = error.message
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400 mb-2">{message}</h1>
        <p className="text-[var(--color-text-muted)]">{details}</p>
      </div>
    </main>
  )
}

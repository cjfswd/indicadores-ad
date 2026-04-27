import type { FC } from 'hono/jsx'

interface LoginPageProps {
  error?: string | null
}

export const LoginPage: FC<LoginPageProps> = ({ error }) => (
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Login — Indicadores AD</title>
      <link rel="stylesheet" href="/css/styles.css" />
    </head>
    <body>
      <div class="flex items-center justify-center min-h-dvh w-full bg-gradient-to-br from-(--color-surface-0) to-(--color-surface-1)">
        <div class="bg-[image:var(--glass-bg)] backdrop-blur-[12px] border border-(--color-border) rounded-xl shadow-(--shadow-card) p-10 w-[min(90vw,400px)] text-center">
          <div class="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 block"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            <h1 class="text-2xl font-bold mb-2">Indicadores AD</h1>
            <p class="text-(--color-text-secondary) mb-8 text-sm">Health+ Cuidados — Atenção Domiciliar</p>
          </div>
          {error && (
            <div class="bg-red-500/15 text-(--color-semaforo-vermelho) p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          <form method="post" action="/login">
            <div class="flex flex-col gap-1.5 mb-4">
              <label class="text-[.8125rem] font-medium text-(--color-text-secondary)">Email</label>
              <input type="email" name="email" class="bg-(--color-surface-0) border border-(--color-border) rounded-lg py-2 px-3 text-sm text-(--color-text-primary) font-[inherit] transition-all duration-150 w-full focus:outline-none focus:border-(--color-accent) focus:ring-3 focus:ring-(--color-accent)/15" placeholder="seu@email.com" required />
            </div>
            <button type="submit" class="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer border border-transparent transition-all duration-150 whitespace-nowrap bg-(--color-accent) text-white hover:bg-(--color-accent-hover) w-full justify-center">Entrar</button>
          </form>
          <p class="mt-6 text-xs text-(--color-text-muted)">Acesso restrito à equipe Health+ Cuidados</p>
        </div>
      </div>
    </body>
  </html>
)

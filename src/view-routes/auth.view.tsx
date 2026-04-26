import { Hono } from 'hono'
import { LoginPage } from '../views/pages/LoginPage.js'

export const authViewRoutes = new Hono()

authViewRoutes.get('/login', (c) => {
  return c.html(<LoginPage />)
})

authViewRoutes.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const email = body['email'] as string | undefined
  if (!email) {
    return c.html(<LoginPage error="Email é obrigatório" />)
  }
  return c.redirect('/dashboard')
})

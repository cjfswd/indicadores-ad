import { Router } from 'express'

export const authViewRouter = Router()

// GET /login
authViewRouter.get('/login', (_req, res) => {
  res.render('login', { layout: false, error: null })
})

// POST /login — simplified dev auth (in production, use Google OAuth)
authViewRouter.post('/login', async (req, res) => {
  const { email } = req.body
  if (!email) {
    res.render('login', { layout: false, error: 'Email é obrigatório' })
    return
  }
  // In dev mode, just redirect — no real auth needed
  // In production, this would validate via Google OAuth
  res.redirect('/dashboard')
})

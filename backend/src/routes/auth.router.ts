import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { getKysely } from '../config/database.js'
import { v4 as uuid } from 'uuid'

export const authRouter = Router()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? ''
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-fallback-secret'
const SESSION_EXPIRES_IN = process.env.SESSION_EXPIRES_IN ?? '10h'

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// ─── POST /auth/google — Validate Google ID token, issue session JWT ──────────

authRouter.post('/google', async (req, res) => {
  const { credential } = req.body as { credential?: string }

  if (!credential) {
    res.status(400).json({ error: 'Token Google nao fornecido' })
    return
  }

  // Verify Google ID token
  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch (err) {
    console.error('[AUTH] Google token verification failed:', (err as Error).message)
    res.status(401).json({ error: 'Token Google invalido. Verifique o Client ID e as origens autorizadas no Google Console.' })
    return
  }

  if (!payload?.email) {
    res.status(401).json({ error: 'Token invalido — email nao encontrado' })
    return
  }

  // Domain restriction
  const domain = payload.hd ?? payload.email.split('@')[1]
  console.log(`[AUTH] Login attempt: email=${payload.email}, domain=${domain}, allowed=${ALLOWED_DOMAIN}`)

  if (ALLOWED_DOMAIN && domain !== ALLOWED_DOMAIN) {
    res.status(403).json({
      error: `Acesso restrito a contas @${ALLOWED_DOMAIN}. Seu dominio: @${domain}`,
    })
    return
  }

  const db = getKysely()
  const email = payload.email
  const nome = payload.name ?? email.split('@')[0]
  const googleSub = payload.sub

  // Find or create user
  let user = await db
    .selectFrom('usuarios')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst()

  if (!user) {
    const id = uuid()
    await db.insertInto('usuarios').values({
      id,
      nome,
      email,
      google_sub: googleSub,
      perfil: 'visualizador',  // Default role for new users
    }).execute()

    user = await db
      .selectFrom('usuarios')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  } else {
    // Update google_sub and last login
    await db.updateTable('usuarios')
      .set({
        google_sub: googleSub,
        ultimo_login: new Date().toISOString(),
        ultimo_ip: req.ip ?? null,
      })
      .where('id', '=', user.id)
      .execute()
  }

  if (!user || !user.ativo) {
    res.status(403).json({ error: 'Usuario desativado' })
    return
  }

  // Issue session JWT
  const sessionToken = jwt.sign(
    { userId: user.id, perfil: user.perfil, email: user.email },
    SESSION_SECRET,
    { expiresIn: SESSION_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  )

  res.json({
    token: sessionToken,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
    },
  })
})

// ─── GET /auth/me — Validate current session ─────────────────────────────────

authRouter.get('/me', (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nao autenticado' })
    return
  }

  try {
    const payload = jwt.verify(header.slice(7), SESSION_SECRET) as {
      userId: string; perfil: string; email: string
    }
    res.json({
      id: payload.userId,
      email: payload.email,
      perfil: payload.perfil,
    })
  } catch {
    res.status(401).json({ error: 'Token expirado' })
  }
})

import { z } from 'zod'

export const perfilSchema = z.enum(['admin', 'editor', 'visualizador'])
export type Perfil = z.infer<typeof perfilSchema>

export const usuarioSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(200),
  perfil: perfilSchema.default('editor'),
  ativo: z.boolean().default(true),
})

export type Usuario = z.infer<typeof usuarioSchema>

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID Token é obrigatório'),
})

export type GoogleAuth = z.infer<typeof googleAuthSchema>

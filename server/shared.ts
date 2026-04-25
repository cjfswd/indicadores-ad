import { z } from "zod"

// ─── Paciente ───
export const modalidadeSchema = z.enum(["AD", "ID"])
export type Modalidade = z.infer<typeof modalidadeSchema>

export const convenioSchema = z.enum(["Camperj", "Unimed"])
export type Convenio = z.infer<typeof convenioSchema>

export const pacienteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(200),
  data_nascimento: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().date().nullable(),
  ).optional(),
  convenio: convenioSchema,
  modalidade: modalidadeSchema,
  observacoes: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().max(2000).nullable(),
  ).optional(),
})
export type Paciente = z.infer<typeof pacienteSchema>

// ─── Usuário ───
export const perfilSchema = z.enum(["admin", "editor", "visualizador"])
export type Perfil = z.infer<typeof perfilSchema>

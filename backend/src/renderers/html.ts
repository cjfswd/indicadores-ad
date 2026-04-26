// ─── HTML helper ─────────────────────────────────────────────────
/** Escapes HTML entities to prevent XSS */
export function esc(val: unknown): string {
  const s = String(val ?? '')
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Returns string only if condition is truthy */
export function when(cond: unknown, html: string, fallback = ''): string {
  return cond ? html : fallback
}

/** Formats ISO date to DD/MM/YYYY */
export function fmtDate(d: string | null): string {
  if (!d) return ''
  const parts = d.split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/** Formats timestamp to DD/MM/YYYY HH:MM */
export function fmtTs(ts: unknown): string {
  if (!ts) return ''
  try {
    const d = new Date(typeof ts === 'string' ? ts.replace(' ', 'T') : ts as number)
    if (isNaN(d.getTime())) return String(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return String(ts) }
}

/** Calculates age from birth date */
export function calcularIdade(dataNasc: string | null): number | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

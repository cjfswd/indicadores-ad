import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface PaginationProps {
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
}

export function Pagination({ pagina, totalPaginas, onChange }: PaginationProps) {
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(Math.max(1, pagina - 1))}
        disabled={pagina === 1}
        className={clsx(
          'p-2 rounded-[var(--radius-md)] transition-colors',
          pagina === 1
            ? 'text-[var(--color-surface-3)] cursor-not-allowed'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--overlay-soft)]',
        )}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm text-[var(--color-text-muted)] tabular-nums">
        Página <span className="text-[var(--color-text-primary)] font-semibold">{pagina}</span> de {totalPaginas}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina === totalPaginas}
        className={clsx(
          'p-2 rounded-[var(--radius-md)] transition-colors',
          pagina === totalPaginas
            ? 'text-[var(--color-surface-3)] cursor-not-allowed'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--overlay-soft)]',
        )}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

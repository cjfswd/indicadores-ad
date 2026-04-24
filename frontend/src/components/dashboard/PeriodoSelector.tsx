import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface PeriodoSelectorProps {
  ano: number
  mes: number
  onChange: (ano: number, mes: number) => void
}

export function PeriodoSelector({ ano, mes, onChange }: PeriodoSelectorProps) {
  const anterior = () => {
    if (mes === 1) onChange(ano - 1, 12)
    else onChange(ano, mes - 1)
  }

  const proximo = () => {
    const now = new Date()
    const maxAno = now.getFullYear()
    const maxMes = now.getMonth() + 1
    if (ano === maxAno && mes >= maxMes) return
    if (mes === 12) onChange(ano + 1, 1)
    else onChange(ano, mes + 1)
  }

  const isUltimo = () => {
    const now = new Date()
    return ano === now.getFullYear() && mes >= now.getMonth() + 1
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={anterior}
        className={clsx(
          'p-2 rounded-[var(--radius-md)] transition-colors duration-200',
          'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)]',
        )}
        aria-label="Mês anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-baseline gap-2 min-w-[180px] justify-center">
        <span className="text-lg font-semibold text-[var(--color-text-primary)]">
          {MESES[mes - 1]}
        </span>
        <span className="text-sm text-[var(--color-text-muted)] font-medium">
          {ano}
        </span>
      </div>

      <button
        onClick={proximo}
        disabled={isUltimo()}
        className={clsx(
          'p-2 rounded-[var(--radius-md)] transition-colors duration-200',
          isUltimo()
            ? 'text-[var(--color-surface-3)] cursor-not-allowed'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)]',
        )}
        aria-label="Próximo mês"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

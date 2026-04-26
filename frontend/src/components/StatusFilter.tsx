import { clsx } from 'clsx'

interface StatusFilterOption<T extends string> {
  value: T
  label: string
}

interface StatusFilterProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: StatusFilterOption<T>[]
}

export function StatusFilter<T extends string>({ value, onChange, options }: StatusFilterProps<T>) {
  return (
    <div className="flex gap-1 p-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface-0)] border border-[var(--color-border)]">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

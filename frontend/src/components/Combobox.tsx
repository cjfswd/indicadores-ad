import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { clsx } from 'clsx'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyLabel?: string
  className?: string
  autoFocus?: boolean
}

export function Combobox({
  options, value, onChange, placeholder = 'Selecione...', emptyLabel = 'Todos', className, autoFocus,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(o => o.value === value)

  const filtered = search.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sublabel?.toLowerCase().includes(search.toLowerCase()) ?? false))
    : options

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        autoFocus={autoFocus}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm text-left',
          'bg-[var(--color-surface-0)] border border-[var(--color-border)]',
          'focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-all',
          'cursor-pointer hover:border-[var(--color-border-hover)]',
          value ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]',
        )}>
        <span className="flex-1 truncate">
          {selectedOption ? (
            <span>
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-[var(--color-text-muted)] ml-1 text-xs">— {selectedOption.sublabel}</span>
              )}
            </span>
          ) : (
            emptyLabel
          )}
        </span>
        {value ? (
          <X size={14} className="text-[var(--color-text-muted)] hover:text-red-400 flex-shrink-0"
            onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} />
        ) : (
          <ChevronDown size={14} className={clsx('text-[var(--color-text-muted)] flex-shrink-0 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] max-h-[280px] flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-1)] shadow-lg animate-fade-in overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--overlay-border)]">
            <Search size={13} className="text-[var(--color-text-muted)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-surface-3)] outline-none"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {/* "All" option */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                !value ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--overlay-soft)]',
              )}>
              {!value && <Check size={12} className="flex-shrink-0" />}
              <span className={clsx(!value ? 'ml-0' : 'ml-5')}>{emptyLabel}</span>
            </button>

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)] italic">
                Nenhum resultado para "{search}"
              </div>
            )}

            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  opt.value === value ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'text-[var(--color-text-primary)] hover:bg-[var(--overlay-soft)]',
                )}>
                {opt.value === value && <Check size={12} className="flex-shrink-0" />}
                <div className={clsx('flex-1 truncate', opt.value !== value && 'ml-5')}>
                  {opt.label}
                  {opt.sublabel && (
                    <span className="text-[var(--color-text-muted)] text-xs ml-1">— {opt.sublabel}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

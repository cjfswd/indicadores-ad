import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export function FormField({ label, required, hint, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-text-muted)] font-medium">
        {label}
        {required && <span className="text-red-400"> *</span>}
        {hint && <span className="text-[var(--color-text-muted)] opacity-60"> ({hint})</span>}
      </span>
      {children}
    </label>
  )
}

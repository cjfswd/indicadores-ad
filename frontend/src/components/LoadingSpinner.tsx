import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
    </div>
  )
}

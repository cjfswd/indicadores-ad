import { useState } from 'react'
import { Paperclip, X, AlertTriangle } from 'lucide-react'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

interface AnexoInputProps {
  arquivo: File | null
  onChange: (file: File | null) => void
}

export function AnexoInput({ arquivo, onChange }: AnexoInputProps) {
  const [erro, setErro] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > MAX_SIZE_BYTES) {
      setErro(`Arquivo excede 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
      e.target.value = ''
      return
    }
    setErro('')
    onChange(file)
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-text-muted)] font-medium">Anexo (opcional, máx. 10 MB)</span>
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleChange}
          className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-[var(--radius-md)] file:border-0 file:text-xs file:font-medium file:bg-[var(--color-accent)]/10 file:text-[var(--color-accent)] file:cursor-pointer hover:file:bg-[var(--color-accent)]/20 text-[var(--color-text-muted)] cursor-pointer"
        />
      </div>
      {erro && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle size={12} /> {erro}
        </div>
      )}
      {arquivo && !erro && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <Paperclip size={12} className="text-[var(--color-accent)]" />
          <span className="truncate">{arquivo.name}</span>
          <span className="text-[var(--color-text-muted)]">
            ({(arquivo.size / 1024).toFixed(0)} KB)
          </span>
          <button type="button" onClick={() => { onChange(null); setErro('') }} className="text-[var(--color-text-muted)] hover:text-red-400">
            <X size={12} />
          </button>
        </div>
      )}
    </label>
  )
}

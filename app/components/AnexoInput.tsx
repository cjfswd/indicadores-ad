import { useState, useRef } from 'react'
import { Paperclip, X, AlertTriangle, Upload } from 'lucide-react'
import { clsx } from 'clsx'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx'

interface AnexoInputProps {
  arquivo: File | null
  onChange: (file: File | null) => void
}

export function AnexoInput({ arquivo, onChange }: AnexoInputProps) {
  const [erro, setErro] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File | null) => {
    if (!file) return
    if (file.size > MAX_SIZE_BYTES) {
      setErro(`Arquivo excede 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
      return
    }
    setErro('')
    onChange(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] ?? null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0] ?? null)
  }

  if (arquivo && !erro) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
        <Paperclip size={14} className="text-[var(--color-accent)] flex-shrink-0" />
        <span className="text-xs text-[var(--color-text-primary)] truncate flex-1">{arquivo.name}</span>
        <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0">
          {(arquivo.size / 1024).toFixed(0)} KB
        </span>
        <button
          type="button"
          onClick={() => { onChange(null); setErro('') }}
          className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-red-400 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] border border-dashed text-xs transition-colors cursor-pointer',
          dragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]',
        )}
      >
        <Upload size={14} className="flex-shrink-0" />
        <span>Anexar arquivo <span className="text-[var(--color-text-muted)]">(opcional, máx. 10 MB)</span></span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="hidden"
      />
      {erro && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle size={12} /> {erro}
        </div>
      )}
    </div>
  )
}

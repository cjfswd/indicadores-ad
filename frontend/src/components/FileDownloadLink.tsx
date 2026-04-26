import { Paperclip, ExternalLink } from 'lucide-react'

interface FileDownloadLinkProps {
  url: string
  baseUrl?: string
}

export function FileDownloadLink({ url, baseUrl = 'http://localhost:3001' }: FileDownloadLinkProps) {
  const filename = url.split('/').pop() ?? 'arquivo'
  const href = url.startsWith('http') ? url : `${baseUrl}${url}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-[11px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
    >
      <Paperclip size={11} />
      {filename}
      <ExternalLink size={10} />
    </a>
  )
}

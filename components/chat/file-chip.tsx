'use client'

import { FileText, X } from 'lucide-react'

interface FileChipProps {
  fileName: string
  fileSize: number
  onRemove?: () => void
  downloadUrl?: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileChip({ fileName, fileSize, onRemove, downloadUrl }: FileChipProps) {
  const content = (
    <>
      <FileText size={16} className="shrink-0 text-muted-foreground" />
      <span className="truncate max-w-[24ch] sm:max-w-[24ch] text-sm text-foreground">
        {fileName}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatFileSize(fileSize)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Remove file"
        >
          <X size={14} />
        </button>
      )}
    </>
  )

  const className =
    'inline-flex items-center gap-2 bg-muted border border-border rounded-md py-2 px-3 hover:bg-accent transition-colors'

  if (downloadUrl) {
    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}

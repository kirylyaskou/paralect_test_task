'use client'

import { X } from 'lucide-react'

interface ImageThumbnailProps {
  src: string
  onRemove: () => void
}

export function ImageThumbnail({ src, onRemove }: ImageThumbnailProps) {
  return (
    <div className="group relative size-16 sm:size-16 shrink-0">
      <img
        src={src}
        alt="Attachment preview"
        className="size-full rounded-md object-cover border border-border"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background/80 border border-border text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
        aria-label="Remove attachment"
      >
        <X size={12} />
      </button>
    </div>
  )
}

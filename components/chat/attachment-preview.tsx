'use client'

import { ImageThumbnail } from './image-thumbnail'
import { FileChip } from './file-chip'
import type { Attachment } from './chat-input'

interface AttachmentPreviewProps {
  attachments: Attachment[]
  onRemove: (index: number) => void
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 bg-muted border-t border-border py-2 px-4 max-w-3xl mx-auto w-full">
      {attachments.map((att, i) =>
        att.type === 'image' ? (
          <ImageThumbnail
            key={`${att.file.name}-${i}`}
            src={att.previewUrl}
            onRemove={() => onRemove(i)}
          />
        ) : (
          <FileChip
            key={`${att.file.name}-${i}`}
            fileName={att.file.name}
            fileSize={att.file.size}
            onRemove={() => onRemove(i)}
          />
        )
      )}
    </div>
  )
}

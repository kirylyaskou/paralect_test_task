'use client'

import { FileChip } from './file-chip'

interface DocumentInfo {
  fileName: string
  fileUrl: string
  fileSize?: number
}

interface MessageDocumentsProps {
  documents: DocumentInfo[]
}

export function MessageDocuments({ documents }: MessageDocumentsProps) {
  if (documents.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {documents.map((doc, i) => (
        <FileChip
          key={`${doc.fileUrl}-${i}`}
          fileName={doc.fileName}
          fileSize={doc.fileSize ?? 0}
          downloadUrl={doc.fileUrl}
        />
      ))}
    </div>
  )
}

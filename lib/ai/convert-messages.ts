import type { UIMessage } from 'ai'
import type { Message } from '@/lib/types'

export function dbMessagesToUIMessages(dbMessages: Message[]): UIMessage[] {
  return dbMessages.map((msg) => {
    const parts: UIMessage['parts'] = []

    // Add image file parts first (if message has image_urls)
    if (msg.image_urls && msg.image_urls.length > 0) {
      for (const url of msg.image_urls) {
        parts.push({
          type: 'file' as const,
          mediaType: 'image/png',
          url,
        })
      }
    }

    // Add text part
    parts.push({ type: 'text' as const, text: msg.content })

    return {
      id: msg.id,
      role: msg.role as UIMessage['role'],
      parts,
    }
  })
}

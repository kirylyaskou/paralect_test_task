import type { UIMessage } from 'ai'
import type { Message } from '@/lib/types'

export function dbMessagesToUIMessages(dbMessages: Message[]): UIMessage[] {
  return dbMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as UIMessage['role'],
    parts: [{ type: 'text' as const, text: msg.content }],
  }))
}

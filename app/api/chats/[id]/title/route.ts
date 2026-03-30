import { generateText } from 'ai'
import { openrouter } from '@/lib/ai/provider'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatById, updateChatTitle } from '@/lib/db/chats'
import { getMessagesByChatId } from '@/lib/db/messages'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params

    const chat = await getChatById(id)
    if (chat.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If chat already has a title, return it without regenerating
    if (chat.title) {
      return Response.json({ title: chat.title })
    }

    const messages = await getMessagesByChatId(id)
    const firstExchange = messages.slice(0, 2)

    if (firstExchange.length === 0) {
      return Response.json(
        { error: 'No messages to generate title from' },
        { status: 400 }
      )
    }

    // Try LLM-generated title, fall back to truncated first message
    let trimmedTitle: string

    try {
      const { text: title } = await generateText({
        model: openrouter.chat('openrouter/free'),
        system:
          'Generate a concise 3-6 word title for this conversation. Return ONLY the title, no quotes or punctuation.',
        prompt: firstExchange
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n'),
      })
      trimmedTitle = title.trim().slice(0, 100)
    } catch {
      // Fallback: use first user message truncated
      const firstUserMsg = firstExchange.find((m) => m.role === 'user')
      trimmedTitle = firstUserMsg
        ? firstUserMsg.content.slice(0, 60).trim() + (firstUserMsg.content.length > 60 ? '...' : '')
        : 'Chat'
    }

    await updateChatTitle(id, trimmedTitle)

    return Response.json({ title: trimmedTitle })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: 'Failed to generate title' },
        { status: 500 }
      )
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

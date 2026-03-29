import { streamText, type UIMessage, convertToModelMessages } from 'ai'
import { openrouter } from '@/lib/ai/provider'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatById } from '@/lib/db/chats'
import { createMessage } from '@/lib/db/messages'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()
    const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
      await req.json()

    if (!chatId || typeof chatId !== 'string') {
      return Response.json({ error: 'chatId is required' }, { status: 400 })
    }

    // Verify chat ownership
    const chat = await getChatById(chatId)
    if (chat.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Save user message before streaming
    const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)
    if (lastUserMessage) {
      const textPart = lastUserMessage.parts.find((p) => p.type === 'text')
      if (textPart && textPart.type === 'text') {
        await createMessage(chatId, 'user', textPart.text)
      }
    }

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: openrouter.chat('meta-llama/llama-4-maverick:free'),
      system: 'You are a helpful assistant.',
      messages: modelMessages,
      onFinish: async ({ text }) => {
        // Save assistant message after stream completes
        await createMessage(chatId, 'assistant', text)
      },
    })

    // Ensure stream completes even if client disconnects
    result.consumeStream()

    return result.toUIMessageStreamResponse()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof DatabaseError) {
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

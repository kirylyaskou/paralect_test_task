import { streamText, type UIMessage, convertToModelMessages } from 'ai'
import { openrouter } from '@/lib/ai/provider'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatById } from '@/lib/db/chats'
import { createMessage } from '@/lib/db/messages'
import { getDocumentsByChatId } from '@/lib/db/documents'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export const maxDuration = 60

function buildSystemPrompt(
  documents: { extracted_text: string | null }[]
): string {
  const base = 'You are a helpful assistant.'
  const docTexts = documents
    .map((d) => d.extracted_text)
    .filter((t): t is string => t !== null)
  if (docTexts.length === 0) return base
  const combined = docTexts.join('\n\n---\n\n')
  const truncated =
    combined.length > 4000
      ? combined.slice(0, 4000) + '... [truncated]'
      : combined
  return `${base}\n\nDocument context:\n${truncated}`
}

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

    // Fetch documents for context injection
    const documents = await getDocumentsByChatId(chatId)

    // Save user message before streaming (include image URLs if present)
    const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)
    if (lastUserMessage) {
      const textPart = lastUserMessage.parts.find((p) => p.type === 'text')
      const imageUrls = lastUserMessage.parts
        .filter(
          (p) =>
            p.type === 'file' &&
            (p as { mediaType?: string }).mediaType?.startsWith('image/')
        )
        .map((p) => (p as { url: string }).url)

      if (textPart && textPart.type === 'text') {
        await createMessage(
          chatId,
          'user',
          textPart.text,
          imageUrls.length > 0 ? imageUrls : undefined
        )
      }
    }

    // Detect if any message contains image file parts for vision model selection
    const hasImages = messages.some((m) =>
      m.parts.some(
        (p) =>
          p.type === 'file' &&
          (p as { mediaType?: string }).mediaType?.startsWith('image/')
      )
    )

    const modelId = hasImages
      ? 'google/gemma-3-27b-it:free'
      : 'meta-llama/llama-3.3-70b-instruct:free'

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: openrouter.chat(modelId),
      system: buildSystemPrompt(documents),
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

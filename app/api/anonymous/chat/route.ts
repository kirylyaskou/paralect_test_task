import { streamText, type UIMessage, convertToModelMessages } from 'ai'
import { openrouter } from '@/lib/ai/provider'
import { getAnonymousUsage, incrementAnonymousUsage } from '@/lib/db/anonymous'
import { DatabaseError } from '@/lib/errors'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, fingerprint }: { messages: UIMessage[]; fingerprint: string } =
      await req.json()

    if (!fingerprint || typeof fingerprint !== 'string') {
      return Response.json({ error: 'fingerprint is required' }, { status: 400 })
    }

    // Check current usage count
    const usage = await getAnonymousUsage(fingerprint)
    if (usage && usage.question_count >= 3) {
      return Response.json({ error: 'limit_reached' }, { status: 403 })
    }

    // Increment usage count before streaming
    await incrementAnonymousUsage(fingerprint)

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: openrouter.chat('openrouter/free'),
      system: 'You are a helpful assistant.',
      messages: modelMessages,
    })

    // Ensure stream completes even if client disconnects
    result.consumeStream()

    return result.toUIMessageStreamResponse()
  } catch (error) {
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

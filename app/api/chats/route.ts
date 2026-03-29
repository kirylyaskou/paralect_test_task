import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatsByUserId, createChat } from '@/lib/db/chats'
import { createChatSchema } from '@/lib/schemas/chat'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const chats = await getChatsByUserId(userId)

    return Response.json({ chats })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      )
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const body = await request.json()

    const result = createChatSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const chat = await createChat(userId, result.data.title)

    return Response.json({ chat }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      )
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

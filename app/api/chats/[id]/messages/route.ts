import { requireAuth } from '@/lib/auth/helpers'
import { getChatById } from '@/lib/db/chats'
import { getMessagesByChatId } from '@/lib/db/messages'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export async function GET(
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

    const messages = await getMessagesByChatId(id)

    return Response.json({ messages })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: 'Failed to fetch messages' },
        { status: 404 }
      )
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

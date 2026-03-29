import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatById, deleteChat } from '@/lib/db/chats'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params

    const chat = await getChatById(id)

    if (chat.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteChat(id)

    return Response.json({ success: true })
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

import { requireAuth } from '@/lib/auth/helpers'
import { getUserById } from '@/lib/db/users'
import { AuthenticationError, DatabaseError } from '@/lib/errors'

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const user = await getUserById(userId)

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof DatabaseError) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

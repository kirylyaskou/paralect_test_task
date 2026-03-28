import 'server-only'

import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth/session'
import { AuthenticationError } from '@/lib/errors'

export async function requireAuth(): Promise<{ userId: string }> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    throw new AuthenticationError('Not authenticated')
  }

  return { userId: payload.userId as string }
}

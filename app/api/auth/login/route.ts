import { NextRequest } from 'next/server'
import { signInSchema } from '@/lib/schemas/auth'
import { createAuthClient } from '@/lib/auth/client'
import { createSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input (ARCH-05)
    const result = signInSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // Authenticate via Supabase Auth (fresh client per request)
    const supabase = createAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    })

    if (error) {
      return Response.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      )
    }

    // Create session cookie
    await createSession(data.user.id)

    // Return success -- client handles redirect
    return Response.json(
      { user: { id: data.user.id, email: data.user.email } },
      { status: 200 }
    )
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

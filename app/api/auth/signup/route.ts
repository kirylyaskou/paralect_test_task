import { NextRequest } from 'next/server'
import { signUpSchema } from '@/lib/schemas/auth'
import { createAuthClient } from '@/lib/auth/client'
import { createSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input (ARCH-05)
    const result = signUpSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // Create user via Supabase Auth (fresh client per request)
    const supabase = createAuthClient()
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          display_name: result.data.displayName,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return Response.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        )
      }
      return Response.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return Response.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create session cookie (AUTH-02 -- session persistence)
    await createSession(data.user.id)

    // Return success -- client handles redirect (NOT server redirect)
    return Response.json(
      { user: { id: data.user.id, email: data.user.email } },
      { status: 201 }
    )
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

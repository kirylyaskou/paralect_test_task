import { NextRequest } from 'next/server'
import { signInSchema } from '@/lib/schemas/auth'
import { createAuthClient } from '@/lib/auth/client'
import { createSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = signInSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = createAuthClient()

    // Try normal sign-in first
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    })

    if (error) {
      // If email not confirmed, auto-confirm and retry
      if (error.message.includes('Email not confirmed')) {
        // Find user by email and confirm them
        const { data: userList } = await supabase.auth.admin.listUsers()
        const user = userList?.users.find(
          (u) => u.email === result.data.email
        )

        if (user) {
          await supabase.auth.admin.updateUserById(user.id, {
            email_confirm: true,
          })

          // Retry sign-in after confirmation
          const { data: retryData, error: retryError } =
            await supabase.auth.signInWithPassword({
              email: result.data.email,
              password: result.data.password,
            })

          if (retryError || !retryData.user) {
            return Response.json(
              { error: 'Invalid email or password. Please try again.' },
              { status: 401 }
            )
          }

          await createSession(retryData.user.id)
          return Response.json(
            { user: { id: retryData.user.id, email: retryData.user.email } },
            { status: 200 }
          )
        }
      }

      return Response.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      )
    }

    // Create session cookie
    await createSession(data.user.id)

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

import 'server-only'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { supabase } from '@/lib/db/client'
import { AuthenticationError } from '@/lib/errors'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function isAllowedType(contentType: string): boolean {
  if (contentType.startsWith('image/')) return true
  return ALLOWED_TYPES.has(contentType)
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth()

    const body = await request.json()
    const { filename, contentType, size, chatId } = body as {
      filename: string
      contentType: string
      size: number
      chatId: string
    }

    if (!filename || !contentType || !size || !chatId) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, size, chatId' },
        { status: 400 }
      )
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 }
      )
    }

    if (!isAllowedType(contentType)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    const path = `${userId}/${chatId}/${Date.now()}-${filename}`

    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUploadUrl(path)

    if (error) {
      console.error('Failed to create signed upload URL:', error)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
    })
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.error('Upload route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import 'server-only'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { supabase } from '@/lib/db/client'
import { createDocument } from '@/lib/db/documents'
import { AuthenticationError } from '@/lib/errors'

const MAX_EXTRACTED_TEXT_LENGTH = 4000

function truncateText(text: string): string {
  if (text.length <= MAX_EXTRACTED_TEXT_LENGTH) return text
  return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH) + '... [truncated]'
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText({ pageJoiner: '\n\n' })
    return result.text
  } finally {
    await parser.destroy()
  }
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
  return result.value
}

export async function POST(request: Request) {
  try {
    await requireAuth()

    const body = await request.json()
    const { path, chatId, fileName, fileType } = body as {
      path: string
      chatId: string
      fileName: string
      fileType: string
    }

    if (!path || !chatId || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: path, chatId, fileName, fileType' },
        { status: 400 }
      )
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${path}`

    // Handle image files -- no extraction needed
    if (fileType.startsWith('image/')) {
      return NextResponse.json({ fileUrl: publicUrl, type: 'image' as const })
    }

    // Handle document files -- extract text and create document record
    let extractedText: string | undefined
    let warning: string | undefined

    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('attachments')
        .download(path)

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`)
      }

      const buffer = await fileData.arrayBuffer()

      if (fileType === 'application/pdf') {
        const rawText = await extractPdfText(buffer)
        extractedText = truncateText(rawText)
      } else if (
        fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const rawText = await extractDocxText(buffer)
        extractedText = truncateText(rawText)
      }
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError)
      warning = 'Text extraction failed. Document saved without extracted text.'
    }

    const document = await createDocument(
      chatId,
      fileName,
      fileType,
      publicUrl,
      extractedText
    )

    return NextResponse.json({
      fileUrl: publicUrl,
      type: 'document' as const,
      extractedText: document.extracted_text ?? undefined,
      ...(warning ? { warning } : {}),
    })
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.error('Upload complete route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

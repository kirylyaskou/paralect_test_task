import 'server-only'

import { supabase } from './client'
import { DatabaseError } from '@/lib/errors'

export async function getDocumentsByChatId(chatId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new DatabaseError('Failed to fetch documents', error)
  }

  return data
}

export async function createDocument(
  chatId: string,
  fileName: string,
  fileType: string,
  fileUrl: string,
  extractedText?: string
) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      chat_id: chatId,
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
      extracted_text: extractedText ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to create document', error)
  }

  return data
}

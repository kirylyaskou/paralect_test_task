import 'server-only'

import { supabase } from './client'
import { DatabaseError } from '@/lib/errors'

export async function getMessagesByChatId(chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new DatabaseError('Failed to fetch messages', error)
  }

  return data
}

export async function createMessage(
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  imageUrls?: string[]
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      role,
      content,
      image_urls: imageUrls ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to create message', error)
  }

  return data
}

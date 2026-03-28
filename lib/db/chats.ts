import 'server-only'

import { supabase } from './client'
import { DatabaseError } from '@/lib/errors'

export async function getChatsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new DatabaseError('Failed to fetch chats', error)
  }

  return data
}

export async function getChatById(chatId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error) {
    throw new DatabaseError('Failed to fetch chat', error)
  }

  return data
}

export async function createChat(userId: string, title?: string) {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, title: title ?? null })
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to create chat', error)
  }

  return data
}

export async function updateChatTitle(chatId: string, title: string) {
  const { data, error } = await supabase
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to update chat title', error)
  }

  return data
}

export async function deleteChat(chatId: string) {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)

  if (error) {
    throw new DatabaseError('Failed to delete chat', error)
  }
}
